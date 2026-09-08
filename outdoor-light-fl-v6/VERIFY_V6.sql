SELECT value AS schema_version FROM v6_meta WHERE key='schema_version';

SELECT name
FROM sqlite_schema
WHERE type='table'
  AND name IN (
    'scheduler_health','scheduler_diagnostics','device_registry','data_sources','genetics',
    'environment_profiles','environment_profile_targets','lifecycle_profiles','lifecycle_stages',
    'runs','plants','plant_stage_history','planned_transitions','plant_location_history',
    'plant_events','plant_measurements','plant_trait_observations','controller_setting_history',
    'actuator_commands','air_quality_snapshots','daily_environment_stats','alert_state',
    'automation_rules','automation_rule_versions','automation_shadow_events'
  )
ORDER BY name;

SELECT id,label,device_type,feedback_type,installed_state FROM device_registry ORDER BY id;

SELECT id,label,measurement_class,installed_state FROM data_sources ORDER BY installed_state,id;

SELECT lp.id,lp.name,ls.sequence_no,ls.name AS stage_name,ls.default_duration_days
FROM lifecycle_profiles lp
LEFT JOIN lifecycle_stages ls ON ls.profile_id=lp.id
ORDER BY lp.id,ls.sequence_no;

SELECT id,primary_method,primary_bound,alarm_due_at,watchdog_last_started_at,last_evaluation_source,last_evaluation_mode,last_evaluation_desired,last_evaluation_action
FROM scheduler_health
WHERE id=1;
