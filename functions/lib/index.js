"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNotificationQueue = void 0;
const admin = __importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
const scheduler_1 = require("firebase-functions/v2/scheduler");
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
const APP_ORIGIN = 'https://usedoser.com';
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const FIXED_MISSED_DOSE_DELAY_MS = HOUR_MS;
const FIXED_SESSION_AUTO_END_DELAY_MS = 3 * HOUR_MS;
const STATE_COLLECTION = 'system';
const STATE_DOC_ID = 'notificationState';
exports.processNotificationQueue = (0, scheduler_1.onSchedule)({
    schedule: 'every 1 minutes',
    region: 'us-central1',
    timeZone: 'Etc/UTC',
}, async () => {
    const usersSnapshot = await db.collection('users').get();
    firebase_functions_1.logger.info('Processing notification queue', {
        userCount: usersSnapshot.size,
    });
    for (const userDoc of usersSnapshot.docs) {
        try {
            await processUser(userDoc);
        }
        catch (error) {
            firebase_functions_1.logger.error('Notification processing failed', {
                uid: userDoc.id,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
});
async function processUser(userDoc) {
    const profile = readProfile(userDoc.data());
    if (!profile)
        return;
    const devicesSnapshot = await userDoc.ref.collection('notificationDevices').get();
    const devices = devicesSnapshot.docs
        .map((doc) => doc.data())
        .filter((device) => device.permission === 'granted' && typeof device.token === 'string');
    if (devices.length === 0) {
        return;
    }
    const timeZone = pickTimeZone(devices);
    const nowMs = Date.now();
    const stateRef = userDoc.ref.collection(STATE_COLLECTION).doc(STATE_DOC_ID);
    const stateSnapshot = await stateRef.get();
    const state = readState(stateSnapshot.data());
    const patch = {};
    const latestDose = await fetchLatestDose(userDoc.ref);
    if (latestDose) {
        await processDoseWindowNotifications(userDoc.id, profile, latestDose, devicesSnapshot.docs, state, patch, nowMs);
    }
    await processDailySummary(userDoc.ref, profile, devicesSnapshot.docs, timeZone, state, patch, nowMs);
    await processStashAlert(userDoc.ref, profile, devicesSnapshot.docs, state, patch, nowMs);
    if (Object.keys(patch).length > 0) {
        patch.updatedAt = nowMs;
        await stateRef.set(patch, { merge: true });
    }
}
async function processDoseWindowNotifications(uid, profile, latestDose, deviceDocs, state, patch, nowMs) {
    const nextWindowAt = getNextDoseWindowAt(profile, latestDose);
    const dueReminderAt = getDoseDueReminderAt(profile, latestDose);
    const missedDoseAt = nextWindowAt + FIXED_MISSED_DOSE_DELAY_MS;
    const sessionAutoEndAt = nextWindowAt + FIXED_SESSION_AUTO_END_DELAY_MS;
    if (profile.notif?.doseDueReminder === true &&
        state.doseDueSentForDoseId !== latestDose.id &&
        nowMs >= dueReminderAt &&
        nowMs < nextWindowAt) {
        await sendToDevices(uid, deviceDocs, buildNotificationMessage('Dose due soon', `Your next ${normalizeTrackedSubstance(latestDose.substance)} window opens at ${formatClockTime(nextWindowAt)}.`, `dose-due-${latestDose.id}`, {
            type: 'dose-due',
            doseId: latestDose.id,
        }, profile.notif?.silent === true));
        patch.doseDueSentForDoseId = latestDose.id;
        patch.doseDueSentAt = nowMs;
    }
    if (profile.notif?.missedDoseAlert === true &&
        state.missedDoseSentForDoseId !== latestDose.id &&
        nowMs >= missedDoseAt) {
        await sendToDevices(uid, deviceDocs, buildNotificationMessage('No dose logged', `It has been 1 hour since your ${normalizeTrackedSubstance(latestDose.substance)} redose window opened and no new dose was logged.`, `missed-dose-${latestDose.id}`, {
            type: 'missed-dose',
            doseId: latestDose.id,
        }, profile.notif?.silent === true));
        patch.missedDoseSentForDoseId = latestDose.id;
        patch.missedDoseSentAt = nowMs;
    }
    if (state.sessionAutoEndedForDoseId !== latestDose.id &&
        nowMs >= sessionAutoEndAt) {
        patch.sessionAutoEndedForDoseId = latestDose.id;
        patch.sessionAutoEndedAt = nowMs;
    }
}
async function processDailySummary(userRef, profile, deviceDocs, timeZone, state, patch, nowMs) {
    if (profile.notif?.dailyUsageSummary !== true)
        return;
    const summaryTime = sanitizeDailySummaryTime(profile.notif?.dailySummaryTime);
    const localNow = getLocalNow(timeZone, nowMs);
    if (localNow.timeKey !== summaryTime)
        return;
    if (state.dailySummaryLastSentDate === localNow.dateKey)
        return;
    const todayStartMs = getStartOfLocalDayMs(timeZone, nowMs);
    const dosesToday = await fetchDosesSince(userRef, todayStartMs);
    const doseCount = dosesToday.length;
    const totalMl = dosesToday.reduce((sum, dose) => sum + dose.amountMl, 0);
    const lastDoseTs = dosesToday[dosesToday.length - 1]?.ts ?? null;
    const lastDoseLabel = lastDoseTs == null ? 'No dose logged today.' : `Last dose at ${formatClockTime(lastDoseTs, timeZone)}.`;
    await sendToDevices(userRef.id, deviceDocs, buildNotificationMessage('Daily summary', `${doseCount} dose${doseCount === 1 ? '' : 's'} today. ${totalMl.toFixed(1)} mL total. ${lastDoseLabel}`, `daily-summary-${localNow.dateKey}`, {
        type: 'daily-summary',
        date: localNow.dateKey,
    }, profile.notif?.silent === true));
    patch.dailySummaryLastSentDate = localNow.dateKey;
    patch.dailySummaryLastSentAt = nowMs;
}
async function processStashAlert(userRef, profile, deviceDocs, state, patch, nowMs) {
    const stash = profile.stash;
    const notif = profile.notif;
    if (notif?.stashRunningLow !== true || !stash || (stash.capacityMl ?? 0) <= 0) {
        if (state.stashLowActive) {
            patch.stashLowActive = false;
        }
        return;
    }
    const refillAt = Math.max(0, stash.refillAt ?? 0);
    const dosesSinceRefill = await fetchDosesSince(userRef, refillAt);
    const consumedMl = dosesSinceRefill.reduce((sum, dose) => sum + dose.amountMl, 0);
    const remainingMl = Math.max(0, (stash.capacityMl ?? 0) - consumedMl);
    const fullMl = (stash.fullMl ?? 0) > 0 ? stash.fullMl ?? 0 : stash.capacityMl ?? 0;
    const remainingPct = fullMl > 0 ? Math.round((remainingMl / fullMl) * 100) : 0;
    const isLow = remainingPct <= (notif.stashLowThresholdPct ?? 20);
    if (isLow && !state.stashLowActive) {
        await sendToDevices(userRef.id, deviceDocs, buildNotificationMessage('Stash running low', `${remainingMl.toFixed(1)} mL remaining (${remainingPct}%).`, 'stash-low', {
            type: 'stash-low',
        }, notif.silent === true));
        patch.stashLowActive = true;
        patch.stashLowSentAt = nowMs;
        return;
    }
    if (!isLow && state.stashLowActive) {
        patch.stashLowActive = false;
    }
}
async function sendToDevices(uid, deviceDocs, message) {
    const activeDeviceDocs = deviceDocs.filter((doc) => {
        const device = doc.data();
        return device.permission === 'granted' && typeof device.token === 'string';
    });
    const tokens = [...new Set(activeDeviceDocs.map((doc) => doc.data().token))];
    if (tokens.length === 0)
        return;
    const response = await messaging.sendEachForMulticast({
        ...message,
        tokens,
    });
    const staleDocDeletes = [];
    response.responses.forEach((result, index) => {
        if (result.success)
            return;
        const code = result.error?.code ?? '';
        if (code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token') {
            const token = tokens[index];
            const staleDoc = activeDeviceDocs.find((doc) => doc.data().token === token);
            if (staleDoc)
                staleDocDeletes.push(staleDoc.ref.delete());
        }
    });
    if (staleDocDeletes.length > 0) {
        await Promise.allSettled(staleDocDeletes);
    }
    firebase_functions_1.logger.info('Sent notification', {
        uid,
        successCount: response.successCount,
        failureCount: response.failureCount,
    });
}
function buildNotificationMessage(title, body, tag, data, silent) {
    const icon = new URL('/favicon.svg', APP_ORIGIN).toString();
    return {
        notification: {
            title,
            body,
        },
        data,
        webpush: {
            headers: {
                Urgency: 'high',
            },
            notification: {
                tag,
                icon,
                badge: icon,
                silent,
            },
            fcmOptions: {
                link: APP_ORIGIN,
            },
        },
    };
}
function readProfile(data) {
    const profile = data.profile;
    if (!profile || typeof profile !== 'object')
        return null;
    return profile;
}
function readState(data) {
    if (!data || typeof data !== 'object')
        return {};
    return data;
}
function normalizeTrackedSubstance(substance) {
    return substance === 'BDO' ? 'BDO' : 'GBL';
}
function preferredIntervalMs(profile, dose) {
    const substance = normalizeTrackedSubstance(dose.substance);
    const minutes = substance === 'BDO'
        ? profile.bdo?.preferredIntervalMinutes ?? 120
        : profile.gbl?.preferredIntervalMinutes ?? 90;
    return Math.max(1, minutes) * MINUTE_MS;
}
function getNextDoseWindowAt(profile, dose) {
    return dose.ts + preferredIntervalMs(profile, dose);
}
function getDoseDueReminderAt(profile, dose) {
    const intervalMs = preferredIntervalMs(profile, dose);
    const requestedLeadMs = (profile.notif?.doseDueLeadMinutes ?? 5) * MINUTE_MS;
    const clampedLeadMs = Math.min(Math.max(0, requestedLeadMs), Math.max(0, intervalMs - MINUTE_MS));
    return getNextDoseWindowAt(profile, dose) - clampedLeadMs;
}
function sanitizeDailySummaryTime(value) {
    if (!value)
        return '09:00';
    return /^\d{2}:\d{2}$/.test(value) ? value : '09:00';
}
function pickTimeZone(devices) {
    const sorted = [...devices].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return sorted[0]?.timeZone ?? 'UTC';
}
function getLocalNow(timeZone, nowMs) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(new Date(nowMs));
    const map = Object.fromEntries(parts
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value]));
    return {
        dateKey: `${map.year}-${map.month}-${map.day}`,
        timeKey: `${map.hour}:${map.minute}`,
    };
}
function getStartOfLocalDayMs(timeZone, nowMs) {
    const localNow = getLocalNow(timeZone, nowMs);
    const [year, month, day] = localNow.dateKey.split('-').map(Number);
    const offsetMs = getTimeZoneOffsetMs(timeZone, nowMs);
    return Date.UTC(year, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0) - offsetMs;
}
function getTimeZoneOffsetMs(timeZone, nowMs) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'shortOffset',
    }).formatToParts(new Date(nowMs));
    const offsetValue = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT+0';
    const match = offsetValue.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
    if (!match)
        return 0;
    const sign = match[1] === '-' ? -1 : 1;
    const hours = Number(match[2] ?? '0');
    const minutes = Number(match[3] ?? '0');
    return sign * (hours * 60 + minutes) * MINUTE_MS;
}
function formatClockTime(ts, timeZone) {
    return new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(ts));
}
async function fetchLatestDose(userRef) {
    const snapshot = await userRef
        .collection('doses')
        .orderBy('ts', 'desc')
        .limit(1)
        .get();
    const doc = snapshot.docs[0];
    if (!doc)
        return null;
    const data = doc.data();
    if (typeof data.id !== 'string' ||
        typeof data.substance !== 'string' ||
        typeof data.amountMl !== 'number' ||
        typeof data.ts !== 'number') {
        return null;
    }
    return {
        id: data.id,
        substance: data.substance,
        amountMl: data.amountMl,
        ts: data.ts,
    };
}
async function fetchDosesSince(userRef, sinceMs) {
    const snapshot = await userRef
        .collection('doses')
        .where('ts', '>=', sinceMs)
        .orderBy('ts', 'asc')
        .get();
    return snapshot.docs
        .map((doc) => doc.data())
        .filter((data) => typeof data.id === 'string' &&
        typeof data.substance === 'string' &&
        typeof data.amountMl === 'number' &&
        typeof data.ts === 'number')
        .map((data) => ({
        id: data.id,
        substance: data.substance,
        amountMl: data.amountMl,
        ts: data.ts,
    }));
}
