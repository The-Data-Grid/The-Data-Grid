-- org / user / role tree
INSERT INTO item_organization 
("item_id",
"data_organization_name_text",
"data_organization_name_link")
VALUES
    (default, 'Bruin Home Solutions', 'bruinhomesolutions.com'),
    (default, 'Renewable Energy Association at UCLA', 'www.rea.seas.ucla.edu');


INSERT INTO item_user 
("item_id",
"data_first_name",
"data_last_name",
"data_email",
"tdg_p_hash",
"data_is_email_public",
"data_is_quarterly_updates",
"privilege_id")
VALUES
    (default, 'Oliver', 'Melgrove', 'oliver@melgrove.com', 'password', true, true, 3),
    (default, 'Tanya', 'Zhong', 'tanyazhong1@gmail.com', 'password', true, true, 3),
    (default, 'Kian', 'Nikzad', 'kian.nikzad@gmail.com', 'password', true, true, 3),
    (default, 'Jorden', 'Van Foreest', 'jorden-van-foreest@thedatagrid.org', '$2b$10$MWv9JnM4zD6TjnZlpSYC4upMdlGatnZxY9zDxKK/8BdTRjIho0p4S', true, true, 2);


INSERT INTO tdg_role 
("role_id",
"role_type_id",
"item_organization_id",
"item_user_id")
VALUES
    (default, 2, 2, 1),
    (default, 2, 1, 2),
    (default, 2, 1, 3);


-- audit_id, catalog_id, data_audit_name, user_id, data_time_created
INSERT INTO item_audit 
("item_id",
"data_audit_name",
"item_user_id",
"item_organization_id",
"data_time_created")
VALUES
    (default, 'Powell Sinks', 2, 1, NOW()),
    (default, 'YRL Sinks', 1, 1, NOW());


-- "submission_id", "item_audit_id", "item_organization_id", "item_user_id", "item_template_id", "data_time_submitted", "data_submission_name"
INSERT INTO item_global
("item_id", "item_audit_id", "item_organization_id", "item_user_id")
VALUES
    (default, 1, 1, 1),
    (default, 1, 1, 2),
    (default, 2, 1, 3),
    (default, 2, 1, 2);