CREATE TABLE IF NOT EXISTS v6_meta (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at INTEGER NOT NULL
);
INSERT OR REPLACE INTO v6_meta(key,value,updated_at) VALUES('schema_version','6.0.0',unixepoch('now')*1000);

CREATE TABLE IF NOT EXISTS scheduler_health (
  id INTEGER PRIMARY KEY CHECK(id=1),
  primary_method TEXT NOT NULL DEFAULT 'durable-object-alarm',
  primary_bound INTEGER NOT NULL DEFAULT 0,
  alarm_due_at INTEGER,
  alarm_last_armed_at INTEGER,
  alarm_last_fired_at INTEGER,
  alarm_last_completed_at INTEGER,
  alarm_last_error TEXT,
  watchdog_cron TEXT,
  watchdog_last_scheduled_at INTEGER,
  watchdog_last_started_at INTEGER,
  watchdog_last_completed_at INTEGER,
  watchdog_last_error TEXT,
  last_evaluation_at INTEGER,
  last_evaluation_source TEXT,
  last_evaluation_mode TEXT,
  last_evaluation_desired TEXT,
  last_evaluation_action TEXT,
  updated_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO scheduler_health(id,primary_method,primary_bound,updated_at) VALUES(1,'durable-object-alarm',0,unixepoch('now')*1000);

CREATE TABLE IF NOT EXISTS scheduler_diagnostics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at INTEGER NOT NULL,
  step_1_due_at INTEGER NOT NULL,
  step_2_due_at INTEGER NOT NULL,
  step_3_due_at INTEGER NOT NULL,
  step_1_seen_at INTEGER,
  step_2_seen_at INTEGER,
  step_3_seen_at INTEGER,
  cron_seen_at INTEGER,
  status TEXT NOT NULL DEFAULT 'RUNNING',
  detail TEXT
);
CREATE INDEX IF NOT EXISTS idx_scheduler_diagnostics_started ON scheduler_diagnostics(started_at DESC);

CREATE TABLE IF NOT EXISTS device_registry (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  device_type TEXT NOT NULL,
  control_transport TEXT,
  capabilities_json TEXT NOT NULL DEFAULT '{}',
  feedback_type TEXT NOT NULL DEFAULT 'NONE',
  installed_state TEXT NOT NULL DEFAULT 'ACTIVE',
  estimated_power_w REAL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO device_registry(id,label,device_type,control_transport,capabilities_json,feedback_type,installed_state,notes,created_at,updated_at) VALUES('OUTDOOR_LIGHT_W118','Outdoor Light','BINARY_SWITCH','VSH_ALEXA_MYDLINK','{"binary_on_off":true,"state_feedback":false,"power_feedback":false}','COMMAND_ONLY','ACTIVE','D-Link DSP-W118 controlled through Virtual Smart Home URL Routine Trigger and Alexa. Physical relay state is not observed.',unixepoch('now')*1000,unixepoch('now')*1000);

CREATE TABLE IF NOT EXISTS data_sources (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  source_class TEXT NOT NULL,
  measurement_class TEXT NOT NULL,
  installed_state TEXT NOT NULL,
  expected_refresh_minutes REAL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO data_sources(id,label,source_class,measurement_class,installed_state,expected_refresh_minutes,notes,created_at,updated_at) VALUES
('OPEN_METEO_PRIMARY','Open-Meteo best-match forecast','REMOTE_MODEL','FORECAST','ACTIVE',60,'Primary forecast. Grid/model data, not a local sensor.',unixepoch('now')*1000,unixepoch('now')*1000),
('OPEN_METEO_BOM','Open-Meteo BOM ACCESS-G secondary','REMOTE_MODEL','FORECAST','ACTIVE',360,'Secondary forecast/model comparison.',unixepoch('now')*1000,unixepoch('now')*1000),
('BOM_ARCHERFIELD','BOM Archerfield Airport','REMOTE_STATION','OBSERVED_EXTERNAL','ACTIVE',10,'Nearby reference observation, not a shed sensor.',unixepoch('now')*1000,unixepoch('now')*1000),
('BOM_WARNINGS','BOM Queensland land warnings','OFFICIAL_WARNING','OBSERVED_EXTERNAL','ACTIVE',10,'Official warning context; local matching is text-based.',unixepoch('now')*1000,unixepoch('now')*1000),
('SATELLITE_SOLAR','Satellite-observed solar','REMOTE_SATELLITE','OBSERVED_EXTERNAL','ACTIVE',30,'Area/grid solar estimate, not canopy PPFD.',unixepoch('now')*1000,unixepoch('now')*1000),
('AIR_QUALITY','Open-Meteo CAMS air quality','REMOTE_MODEL','FORECAST','ACTIVE',60,'Air-quality model context; not a local sensor.',unixepoch('now')*1000,unixepoch('now')*1000),
('INTERNAL_CLIMATE','Internal temperature/RH','LOCAL_SENSOR','MEASURED','NOT_INSTALLED',1,'Supported for future local climate sensing.',unixepoch('now')*1000,unixepoch('now')*1000),
('PAR_PPFD','PAR/PPFD sensor','LOCAL_SENSOR','MEASURED','NOT_INSTALLED',1,'Supported for future PPFD/DLI measurement.',unixepoch('now')*1000,unixepoch('now')*1000),
('CO2_LOCAL','CO2 sensor','LOCAL_SENSOR','MEASURED','NOT_INSTALLED',1,'Supported for future CO2 measurement.',unixepoch('now')*1000,unixepoch('now')*1000),
('SUBSTRATE_LOCAL','Substrate/root-zone sensors','LOCAL_SENSOR','MEASURED','NOT_INSTALLED',1,'Supported for future VWC/EC/temperature/pH sensing.',unixepoch('now')*1000,unixepoch('now')*1000),
('ACTUATOR_FEEDBACK','Physical actuator feedback','LOCAL_SENSOR','MEASURED','NOT_INSTALLED',1,'Supported for future relay/current/power feedback.',unixepoch('now')*1000,unixepoch('now')*1000);

CREATE TABLE IF NOT EXISTS genetics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  breeder_source TEXT,
  lineage TEXT,
  parent_a TEXT,
  parent_b TEXT,
  generation TEXT,
  source_type TEXT,
  acquired_date TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_genetics_name ON genetics(name COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS environment_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS environment_profile_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  metric_key TEXT NOT NULL,
  target_min REAL,
  target_max REAL,
  target_value REAL,
  unit TEXT,
  source_requirement TEXT,
  notes TEXT,
  FOREIGN KEY(profile_id) REFERENCES environment_profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_environment_profile_targets_profile ON environment_profile_targets(profile_id);

CREATE TABLE IF NOT EXISTS lifecycle_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO lifecycle_profiles(id,name,notes,created_at,updated_at) VALUES(1,'Flexible staged lifecycle','Neutral configurable lifecycle. Stage durations and environmental targets are user-defined.',unixepoch('now')*1000,unixepoch('now')*1000);

CREATE TABLE IF NOT EXISTS lifecycle_stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  sequence_no INTEGER NOT NULL,
  name TEXT NOT NULL,
  default_duration_days INTEGER,
  suggested_photoperiod_hours REAL,
  suggested_anchor TEXT,
  environment_profile_id INTEGER,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(profile_id,sequence_no),
  FOREIGN KEY(profile_id) REFERENCES lifecycle_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY(environment_profile_id) REFERENCES environment_profiles(id)
);
INSERT OR IGNORE INTO lifecycle_stages(id,profile_id,sequence_no,name,default_duration_days,notes,created_at,updated_at) VALUES
(1,1,10,'Propagation',NULL,'Optional stage.',unixepoch('now')*1000,unixepoch('now')*1000),
(2,1,20,'Establishment',NULL,'Optional stage.',unixepoch('now')*1000,unixepoch('now')*1000),
(3,1,30,'Vegetative',NULL,'Configurable stage.',unixepoch('now')*1000,unixepoch('now')*1000),
(4,1,40,'Transition',NULL,'Optional stage.',unixepoch('now')*1000,unixepoch('now')*1000),
(5,1,50,'Flowering',NULL,'Configurable stage.',unixepoch('now')*1000,unixepoch('now')*1000),
(6,1,60,'Finishing',NULL,'Optional stage.',unixepoch('now')*1000,unixepoch('now')*1000),
(7,1,70,'Complete',NULL,'Terminal stage.',unixepoch('now')*1000,unixepoch('now')*1000);

CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  start_date TEXT,
  lifecycle_profile_id INTEGER,
  default_zone_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(lifecycle_profile_id) REFERENCES lifecycle_profiles(id),
  FOREIGN KEY(default_zone_id) REFERENCES zones(id)
);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status,created_at DESC);

CREATE TABLE IF NOT EXISTS plants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  genetics_id INTEGER,
  run_id INTEGER,
  lifecycle_profile_id INTEGER,
  propagation_type TEXT,
  start_date TEXT NOT NULL,
  current_stage_id INTEGER,
  current_stage_started_at INTEGER,
  current_zone_id TEXT NOT NULL DEFAULT 'UNKNOWN',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(genetics_id) REFERENCES genetics(id),
  FOREIGN KEY(run_id) REFERENCES runs(id),
  FOREIGN KEY(lifecycle_profile_id) REFERENCES lifecycle_profiles(id),
  FOREIGN KEY(current_stage_id) REFERENCES lifecycle_stages(id),
  FOREIGN KEY(current_zone_id) REFERENCES zones(id)
);
CREATE INDEX IF NOT EXISTS idx_plants_status ON plants(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plants_run ON plants(run_id,status);
CREATE INDEX IF NOT EXISTS idx_plants_genetics ON plants(genetics_id);

CREATE TABLE IF NOT EXISTS plant_stage_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL,
  stage_id INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  source TEXT NOT NULL DEFAULT 'USER',
  note TEXT,
  FOREIGN KEY(plant_id) REFERENCES plants(id) ON DELETE CASCADE,
  FOREIGN KEY(stage_id) REFERENCES lifecycle_stages(id)
);
CREATE INDEX IF NOT EXISTS idx_plant_stage_history_plant ON plant_stage_history(plant_id,started_at DESC);

CREATE TABLE IF NOT EXISTS planned_transitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL UNIQUE,
  next_stage_id INTEGER,
  transition_mode TEXT NOT NULL DEFAULT 'MANUAL',
  target_date TEXT,
  duration_days INTEGER,
  status TEXT NOT NULL DEFAULT 'PENDING',
  note TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(plant_id) REFERENCES plants(id) ON DELETE CASCADE,
  FOREIGN KEY(next_stage_id) REFERENCES lifecycle_stages(id)
);
CREATE INDEX IF NOT EXISTS idx_planned_transitions_date ON planned_transitions(status,target_date);

CREATE TABLE IF NOT EXISTS plant_location_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL,
  zone_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  source TEXT NOT NULL DEFAULT 'USER',
  note TEXT,
  FOREIGN KEY(plant_id) REFERENCES plants(id) ON DELETE CASCADE,
  FOREIGN KEY(zone_id) REFERENCES zones(id)
);
CREATE INDEX IF NOT EXISTS idx_plant_location_history_plant ON plant_location_history(plant_id,started_at DESC);
CREATE INDEX IF NOT EXISTS idx_plant_location_history_zone ON plant_location_history(zone_id,started_at DESC);

CREATE TABLE IF NOT EXISTS plant_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER,
  run_id INTEGER,
  ts INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT,
  detail TEXT,
  source TEXT NOT NULL DEFAULT 'USER',
  metadata_json TEXT,
  FOREIGN KEY(plant_id) REFERENCES plants(id) ON DELETE CASCADE,
  FOREIGN KEY(run_id) REFERENCES runs(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_plant_events_plant ON plant_events(plant_id,ts DESC);
CREATE INDEX IF NOT EXISTS idx_plant_events_run ON plant_events(run_id,ts DESC);

CREATE TABLE IF NOT EXISTS plant_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL,
  observed_at INTEGER NOT NULL,
  metric_key TEXT NOT NULL,
  numeric_value REAL,
  text_value TEXT,
  unit TEXT,
  measurement_class TEXT NOT NULL DEFAULT 'MANUAL',
  zone_id TEXT,
  note TEXT,
  FOREIGN KEY(plant_id) REFERENCES plants(id) ON DELETE CASCADE,
  FOREIGN KEY(zone_id) REFERENCES zones(id)
);
CREATE INDEX IF NOT EXISTS idx_plant_measurements_plant ON plant_measurements(plant_id,observed_at DESC);

CREATE TABLE IF NOT EXISTS plant_trait_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL,
  observed_at INTEGER NOT NULL,
  trait_name TEXT NOT NULL,
  value_text TEXT,
  score REAL,
  note TEXT,
  FOREIGN KEY(plant_id) REFERENCES plants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_plant_traits_plant ON plant_trait_observations(plant_id,observed_at DESC);

CREATE TABLE IF NOT EXISTS controller_setting_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  setting_key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  source TEXT NOT NULL,
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_controller_setting_history_ts ON controller_setting_history(ts DESC);

CREATE TABLE IF NOT EXISTS actuator_commands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  desired_state TEXT NOT NULL,
  command_kind TEXT NOT NULL,
  source TEXT NOT NULL,
  provider_http_status INTEGER,
  observed_state TEXT,
  observed_at INTEGER,
  detail TEXT,
  FOREIGN KEY(device_id) REFERENCES device_registry(id)
);
CREATE INDEX IF NOT EXISTS idx_actuator_commands_ts ON actuator_commands(ts DESC);

CREATE TABLE IF NOT EXISTS air_quality_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fetched_at INTEGER NOT NULL,
  source TEXT NOT NULL,
  observed_for TEXT,
  us_aqi REAL,
  european_aqi REAL,
  pm2_5 REAL,
  pm10 REAL,
  ozone REAL,
  dust REAL,
  aerosol_optical_depth REAL,
  uv_index REAL,
  payload_json TEXT,
  error_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_air_quality_snapshots_time ON air_quality_snapshots(fetched_at DESC);

CREATE TABLE IF NOT EXISTS daily_environment_stats (
  day TEXT PRIMARY KEY,
  external_temp_min_c REAL,
  external_temp_mean_c REAL,
  external_temp_max_c REAL,
  external_rh_min_pct REAL,
  external_rh_mean_pct REAL,
  external_rh_max_pct REAL,
  external_dew_point_mean_c REAL,
  external_gust_max_kmh REAL,
  satellite_ghi_peak_wm2 REAL,
  satellite_solar_energy_mj_m2 REAL,
  observation_count INTEGER,
  satellite_count INTEGER,
  quality_label TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS alert_state (
  alert_key TEXT PRIMARY KEY,
  acknowledged_at INTEGER,
  snoozed_until INTEGER,
  note TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS automation_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'MONITOR',
  priority INTEGER NOT NULL DEFAULT 50,
  scope_type TEXT,
  scope_id TEXT,
  conditions_json TEXT NOT NULL DEFAULT '[]',
  actions_json TEXT NOT NULL DEFAULT '[]',
  deadband_json TEXT,
  minimum_on_seconds INTEGER,
  minimum_off_seconds INTEGER,
  start_delay_seconds INTEGER,
  stop_delay_seconds INTEGER,
  failsafe_json TEXT,
  enabled INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(enabled,priority DESC);

CREATE TABLE IF NOT EXISTS automation_rule_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id INTEGER NOT NULL,
  version_no INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  note TEXT,
  UNIQUE(rule_id,version_no),
  FOREIGN KEY(rule_id) REFERENCES automation_rules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS automation_shadow_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id INTEGER NOT NULL,
  evaluated_at INTEGER NOT NULL,
  matched INTEGER NOT NULL,
  proposed_action_json TEXT,
  reason_json TEXT,
  FOREIGN KEY(rule_id) REFERENCES automation_rules(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_automation_shadow_events_rule ON automation_shadow_events(rule_id,evaluated_at DESC);
