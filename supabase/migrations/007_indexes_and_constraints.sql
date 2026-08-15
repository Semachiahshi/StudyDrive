create index idx_projects_user_id on projects(user_id);
create index idx_topics_project_id on topics(project_id);
create index idx_study_items_project_id on study_items(project_id);
create index idx_study_item_options_item_id on study_item_options(study_item_id);
create index idx_study_item_topics_topic_id on study_item_topics(topic_id);
create index idx_study_sessions_project_id on study_sessions(project_id);
create index idx_attempts_session_id on attempts(session_id);
create index idx_daily_plans_project_date on daily_plans(project_id, date);
create index idx_study_events_project_created on study_events(project_id, server_created_at);
create index idx_study_events_user_created on study_events(user_id, server_created_at);

create unique index one_primary_topic_per_item
on study_item_topics(study_item_id)
where is_primary = true;

create trigger profiles_updated_at before update on profiles
for each row execute function update_timestamp();

create trigger projects_updated_at before update on projects
for each row execute function update_timestamp();

create trigger study_items_updated_at before update on study_items
for each row execute function update_timestamp();