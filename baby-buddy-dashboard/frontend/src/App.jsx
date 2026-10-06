import React, { useState, useEffect } from "react";
import { useBabyData } from "./hooks/useBabyData";
import { useTimers } from "./hooks/useTimers";
import { UnitContext } from "./utils/units";
import { Icons } from "./components/Icons";
import { colors } from "./utils/colors";
import { applyTheme } from "./utils/theme";
import { readStoredMode, writeStoredMode, resolveMode } from "./utils/themeMode";
import { readStoredNannyMode, writeStoredNannyMode } from "./utils/nannyModePreference";
import { getAge, formatElapsed, timeAgo, toLocalISODate, REMINDER_DONE_TAG } from "./utils/formatters";
import { api } from "./api";
import { pendingReminders, serializeCompletionBody } from "./utils/reminders";
import { DEFAULT_EXPANDED_ACTION_GROUP, TIMER_ACTION_IDS } from "./utils/quickActions";
import { useTranslation } from "./locales";
import OverviewTab from "./tabs/OverviewTab";
import GrowthTab from "./tabs/GrowthTab";
import HistoryTab from "./tabs/HistoryTab";
import ReportsTab from "./tabs/ReportsTab";
import NannyTab from "./tabs/NannyTab";
import FeedingForm from "./components/forms/FeedingForm";
import SleepForm from "./components/forms/SleepForm";
import DiaperForm from "./components/forms/DiaperForm";
import TemperatureForm from "./components/forms/TemperatureForm";
import TummyTimeForm from "./components/forms/TummyTimeForm";
import NoteForm from "./components/forms/NoteForm";
import BathForm from "./components/forms/BathForm";
import EventForm from "./components/forms/EventForm";
import ReminderForm from "./components/forms/ReminderForm";
import WeightForm from "./components/forms/WeightForm";
import HeightForm from "./components/forms/HeightForm";
import HeadCircumferenceForm from "./components/forms/HeadCircumferenceForm";
import BmiForm from "./components/forms/BmiForm";
import MedicationForm from "./components/forms/MedicationForm";
import ThemeToggle from "./components/ThemeToggle";
import LanguageSelector from "./components/LanguageSelector";
import AlertBanner from "./components/AlertBanner";
import DailyFactCard from "./components/DailyFactCard";
import NannyTaskForm from "./components/forms/NannyTaskForm";

import "./styles.css";

const TABS = [
  { id: "overview", labelKey: "tab.home", icon: <Icons.Activity /> },
  { id: "history", labelKey: "tab.history", icon: <Icons.Calendar /> },
  { id: "growth", labelKey: "tab.growth", icon: <Icons.TrendUp /> },
  { id: "reports", labelKey: "tab.analysis", icon: <Icons.TrendUp /> },
];

const TIMER_ACTIONS_BY_ID = {
  feeding: { id: "feeding", labelKey: "action.feeding", icon: <Icons.Bottle />, color: colors.feeding },
  sleep: { id: "sleep", labelKey: "action.sleep", icon: <Icons.Moon />, color: colors.sleep },
  tummy: { id: "tummy", labelKey: "action.tummyTime", icon: <Icons.Sun />, color: colors.tummy },
};

const TIMER_TYPES = TIMER_ACTION_IDS.map((id) => TIMER_ACTIONS_BY_ID[id]);

const ACTION_GROUPS = [
  {
    id: "timer",
    labelKey: "header.timer",
    actions: TIMER_TYPES,
  },
  {
    id: "track",
    labelKey: "group.track",
    actions: [
      { id: "feeding", labelKey: "action.feeding", icon: <Icons.Bottle />, color: colors.feeding },
      { id: "sleep", labelKey: "action.sleep", icon: <Icons.Moon />, color: colors.sleep },
      { id: "diaper", labelKey: "action.diaper", icon: <Icons.Droplet />, color: colors.diaper },
      { id: "tummy", labelKey: "action.tummy", icon: <Icons.Sun />, color: colors.tummy },
      { id: "bath", labelKey: "bathForm.logTitle", icon: <Icons.Bath />, color: colors.bath },
      { id: "medication", labelKey: "action.medication", icon: <Icons.Pill />, color: colors.medication },
    ],
  },
  {
    id: "measure",
    labelKey: "group.measure",
    actions: [
      { id: "temp", labelKey: "action.temp", icon: <Icons.Temp />, color: colors.temp },
      { id: "weight", labelKey: "action.weight", icon: <Icons.Weight />, color: colors.growth },
      { id: "height", labelKey: "action.height", icon: <Icons.Ruler />, color: colors.height },
      { id: "headCircumference", labelKey: "action.headCircumference", icon: <Icons.Ruler />, color: colors.headCircumference },
      { id: "bmi", labelKey: "action.bmi", icon: <Icons.Gauge />, color: colors.bmi },
    ],
  },
  {
    id: "note",
    labelKey: "group.note",
    actions: [
      { id: "note", labelKey: "action.note", icon: <Icons.StickyNote />, color: colors.note },
    ],
  },
];

function toLocalDatetime(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function timerNameToType(name) {
  if (!name) return "feeding";
  const n = name.toLowerCase();
  if (n.includes("sleep")) return "sleep";
  if (n.includes("tummy")) return "tummy";
  return "feeding";
}

export default function App() {
  const t = useTranslation();
  const data = useBabyData();
  const timer = useTimers(data.timers, data.child?.id);

  useEffect(() => {
    if (data.theme) applyTheme(data.theme);
  }, [data.theme]);

  // index.html sets data-mode before first paint; this keeps it in sync afterwards -
  // when the user picks a mode, and, while on auto, when the device flips light/dark
  // under us (an OS scheduled dark mode, for instance).
  const [themeMode, setThemeMode] = useState(readStoredMode);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.setAttribute("data-mode", resolveMode(themeMode, media.matches));
    };
    apply();
    if (themeMode !== "auto") return undefined;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [themeMode]);

  const changeThemeMode = (mode) => {
    writeStoredMode(mode);
    setThemeMode(mode);
  };

  const [activeTab, setActiveTab] = useState("overview");
  const [nannyMode, setNannyMode] = useState(readStoredNannyMode);
  const [modal, setModal] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(DEFAULT_EXPANDED_ACTION_GROUP);
  const [editingTimerId, setEditingTimerId] = useState(null);
  const [dismissedAlerts, setDismissedAlerts] = useState({});

  const closeModal = () => setModal(null);
  const handleFormDone = () => {
    closeModal();
    data.refetch();
  };

  const handleAddNannyTask = () => {
    if (!data.child?.id) return;
    setModal({ type: "nannyTask" });
  };

  const enterNannyMode = () => {
    writeStoredNannyMode(true);
    setNannyMode(true);
    setShowActions(false);
  };

  const exitNannyMode = () => {
    writeStoredNannyMode(false);
    setNannyMode(false);
    closeModal();
  };

  const handleAddNannySleep = () => {
    if (!data.child?.id) return;
    setModal({ type: "nannySleep" });
  };

  const showNannyExperience = nannyMode;

  const alertMessages = [];
  const feedHrs = data.alertConfig?.feeding_alert_hours ?? 3;
  const diaperHrs = data.alertConfig?.diaper_alert_hours ?? 3;
  const lastFeed = data.recentFeedings?.[0];
  const lastChange = data.recentChanges?.[0];
  const hoursSince = (t) => (Date.now() - new Date(t).getTime()) / 3600000;
  if (lastFeed && hoursSince(lastFeed.end || lastFeed.start) >= feedHrs) {
    const key = `feed-${lastFeed.id}`;
    if (!dismissedAlerts[key]) alertMessages.push({ key, text: t("alert.sinceLastFeeding", { elapsed: timeAgo(lastFeed.end || lastFeed.start) }) });
  }
  if (lastChange && hoursSince(lastChange.time) >= diaperHrs) {
    const key = `diaper-${lastChange.id}`;
    if (!dismissedAlerts[key]) alertMessages.push({ key, text: t("alert.sinceLastDiaper", { elapsed: timeAgo(lastChange.time) }) });
  }


  const today = toLocalISODate(new Date());
  pendingReminders(data.reminders, data.reminderDones, today, data.child?.id).forEach((r) => {
    alertMessages.push({
      key: `reminder-${r.id}-${today}`,
      text: r.title,
      actionLabel: t("reminders.done"),
      onAction: async () => {
        await api.createNote({
          child: data.child.id,
          note: serializeCompletionBody(r.id),
          tags: [REMINDER_DONE_TAG],
          time: new Date().toISOString(),
        });
        await data.refetch();
      },
    });
  });

  if (data.loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <UnitContext.Provider value={data.unitSystem}>
    <div className="app">
      {/* Header */}
      <header className="app-header fade-in">
        <div className="header-title-group" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="avatar">
            {data.child?.picture ? (
              <img src={data.child.picture} alt={data.child.first_name} className="avatar-img" />
            ) : (
              <Icons.Baby />
            )}
          </div>
          <div>
            <h1 className="baby-name">
              {data.child?.first_name || t("header.defaultBabyName")}
            </h1>
            {data.child?.birth_date && (
              <span className="baby-age">{getAge(data.child.birth_date)}</span>
            )}
          </div>
        </div>
        <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {data.error && (
            <span className="sync-error">{t("header.connectionError")}</span>
          )}
          <LanguageSelector />
          <ThemeToggle mode={themeMode} onChange={changeThemeMode} />
          {!showNannyExperience && (
            <button className="nanny-mode-toggle" onClick={enterNannyMode} aria-label={t("nanny.enterMode")}>
              <Icons.Caregiver />
              <span>{t("nanny.enterMode")}</span>
            </button>
          )}
          {showNannyExperience && (
            <button className="nanny-mode-toggle nanny-mode-toggle-exit" onClick={exitNannyMode} aria-label={t("nanny.exitMode")}>
              <Icons.X />
              <span>{t("nanny.exitMode")}</span>
            </button>
          )}
          {data.lastSync && !data.error && (
            <span className="sync-time">
              {data.lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button className="refresh-btn" onClick={data.refetch} title={t("settings.refreshNow")} aria-label={t("settings.refreshNow")}>
            <Icons.Activity />
          </button>
        </div>
      </header>

      {/* Child Switcher (only when 2+ children) */}
      {!showNannyExperience && data.children.length >= 2 && (
        <div className="child-switcher fade-in">
          {data.children.map((c) => (
            <button
              key={c.id}
              className={`child-chip${c.id === data.child?.id ? " child-chip-active" : ""}`}
              onClick={() => data.selectChild(c.id)}
            >
              {c.first_name}
            </button>
          ))}
        </div>
      )}

      {/* Active Timer Bars */}
      {!showNannyExperience && timer.activeTimers.map((activeTimer) => (
        <div key={activeTimer.id} className="timer-bar fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="timer-pulse" />
            <Icons.Timer />
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {activeTimer.name}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {editingTimerId === activeTimer.id ? (
              <input
                type="datetime-local"
                className="timer-edit-input"
                defaultValue={toLocalDatetime(activeTimer.start)}
                autoFocus
                onBlur={(e) => {
                  if (e.target.value) {
                    timer.editTimer(activeTimer.id, `${e.target.value}:00`);
                  }
                  setEditingTimerId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.target.blur();
                  if (e.key === "Escape") setEditingTimerId(null);
                }}
              />
            ) : (
              <span
                className="timer-elapsed"
                style={{ cursor: "pointer" }}
                title={t("header.timerEditHint")}
                onClick={() => setEditingTimerId(activeTimer.id)}
              >
                {formatElapsed(timer.elapsedMap[activeTimer.id] || 0)}
              </span>
            )}
            <button
              className="timer-save-btn"
              onClick={async () => {
                const stopped = await timer.stopTimer(activeTimer.id);
                if (stopped) {
                  setModal({ type: timerNameToType(stopped.name), timerId: stopped.id });
                }
              }}
            >
              {t("header.timerSave")}
            </button>
            <button
              className="timer-discard-btn"
              onClick={() => timer.discardTimer(activeTimer.id)}
            >
              <Icons.X />
            </button>
          </div>
        </div>
      ))}

      {/* Tab Navigation */}
      {!showNannyExperience && (
      <nav className="tab-nav fade-in">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {t(tab.labelKey)}
          </button>
        ))}
      </nav>
      )}

      {/* Tab Content */}
      <main className={showNannyExperience ? "tab-content nanny-exclusive-content" : "tab-content"}>
        {showNannyExperience ? (
          <NannyTab
            childId={data.child?.id}
            nannyName={data.nannyName}
            feedings={data.monthlyFeedings?.length ? data.monthlyFeedings : data.recentFeedings}
            nannyTasks={data.nannyTasks}
            nannyTaskDones={data.nannyTaskDones}
            onTaskDone={data.refetch}
            onAddTask={handleAddNannyTask}
            onAddSleep={handleAddNannySleep}
          />
        ) : (
          <>
        <AlertBanner messages={alertMessages} onDismiss={(k) => setDismissedAlerts((p) => ({ ...p, [k]: true }))} />
        <DailyFactCard
            feedings={data.allTime.feedings}
            sleep={data.allTime.sleep}
            changes={data.allTime.changes}
            baths={data.baths}
            tummyTimes={data.weeklyTummyTimes}
            weights={data.weights}
          />
        {activeTab === "overview" && (
          <OverviewTab
            feedings={data.feedings}
            recentFeedings={data.recentFeedings}
            weeklyFeedings={data.weeklyFeedings}
            sleepEntries={data.sleepEntries}
            weeklySleep={data.weeklySleep}
            changes={data.changes}
            recentChanges={data.recentChanges}
            monthlyChanges={data.monthlyChanges}
            tummyTimes={data.tummyTimes}
            weeklyTummyTimes={data.weeklyTummyTimes}
            baths={data.baths}
            onEditEntry={(type, entry) => setModal({ type, entry })}
          />
        )}
        {activeTab === "history" && (
          <HistoryTab
            childId={data.child?.id}
            notes={data.notes}
            events={data.events}
            reminders={data.reminders}
            reminderDones={data.reminderDones}
            medications={data.medications}
            medicationUnavailable={data.medicationUnavailable}
            medicationError={data.medicationError}
            onAddEvent={() => setModal({ type: "event" })}
            onAddReminder={() => setModal({ type: "reminder" })}
            onEditEntry={(type, entry) => setModal({ type, entry })}
            onDataChanged={data.refetch}
          />
        )}
        {activeTab === "growth" && (
          <GrowthTab
            weights={data.weights}
            heights={data.heights}
            headCircumferences={data.headCircumferences}
            bmis={data.bmis}
            birthDate={data.child?.birth_date}
            childSex={data.childSex}
            monthlyFeedings={data.monthlyFeedings}
            monthlySleep={data.monthlySleep}
            onEditEntry={(type, entry) => setModal({ type, entry })}
          />
        )}
        {activeTab === "reports" && (
          <ReportsTab
            monthlyFeedings={data.monthlyFeedings}
            monthlyChanges={data.monthlyChanges}
          />
        )}
          </>
        )}
      </main>

      {/* Quick Action FAB */}
      {!showNannyExperience && (
      <div className="fab-container">
        {showActions && (
          <div className="fab-menu fade-in">
            {ACTION_GROUPS.map((group) => {
              const isOpen = expandedGroup === group.id;
              return (
                <div key={group.id} className="fab-group">
                  <button
                    className={`fab-group-label${isOpen ? " fab-group-label-active" : ""}`}
                    onClick={() => setExpandedGroup(isOpen ? null : group.id)}
                  >
                    {t(group.labelKey)}
                  </button>
                  {isOpen && (
                    <div className="fab-group-items">
                      {group.actions.map((action) => (
                        <button
                          key={action.id}
                          className="fab-action"
                          onClick={() => {
                            if (group.id === "timer") {
                              timer.startTimer(action.id);
                            } else {
                              setModal({ type: action.id });
                            }
                            setShowActions(false);
                          }}
                        >
                          <span
                            className="fab-action-icon"
                            style={{ background: `${action.color}18`, color: action.color }}
                          >
                            {action.icon}
                          </span>
                          <span className="fab-action-label">{t(action.labelKey)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <button
          className="fab-btn"
          style={{ background: showActions ? "var(--text-muted)" : "var(--accent)" }}
          onClick={() => { setShowActions(!showActions); setExpandedGroup(DEFAULT_EXPANDED_ACTION_GROUP); }}
        >
          <span style={{ transform: showActions ? "rotate(45deg)" : "none", transition: "transform 0.2s", display: "flex" }}>
            <Icons.Plus />
          </span>
        </button>
      </div>
      )}

      {/* Modals */}
      {modal?.type === "feeding" && (
        <FeedingForm
          childId={data.child?.id}
          timerId={modal.timerId}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {(modal?.type === "sleep" || modal?.type === "nannySleep") && (
        <SleepForm
          childId={data.child?.id}
          timerId={modal.timerId}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "diaper" && (
        <DiaperForm
          childId={data.child?.id}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "temp" && (
        <TemperatureForm
          childId={data.child?.id}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "tummy" && (
        <TummyTimeForm
          childId={data.child?.id}
          timerId={modal.timerId}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "weight" && (
        <WeightForm
          childId={data.child?.id}
          entry={modal.entry}
          weights={data.weights}
          heights={data.heights}
          bmis={data.bmis}
          unitSystem={data.unitSystem}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "height" && (
        <HeightForm
          childId={data.child?.id}
          entry={modal.entry}
          weights={data.weights}
          heights={data.heights}
          bmis={data.bmis}
          unitSystem={data.unitSystem}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "headCircumference" && (
        <HeadCircumferenceForm
          childId={data.child?.id}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "bmi" && (
        <BmiForm
          childId={data.child?.id}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "medication" && (
        <MedicationForm
          childId={data.child?.id}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "note" && (
        <NoteForm
          childId={data.child?.id}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "bath" && (
        <BathForm
          childId={data.child?.id}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "event" && (
        <EventForm
          childId={data.child?.id}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "reminder" && (
        <ReminderForm
          childId={data.child?.id}
          entry={modal.entry}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
      {modal?.type === "nannyTask" && (
        <NannyTaskForm
          childId={data.child?.id}
          nannyName={data.nannyName}
          onDone={handleFormDone}
          onClose={closeModal}
        />
      )}
    </div>
    </UnitContext.Provider>
  );
}
