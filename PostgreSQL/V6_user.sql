-- org / user / role tree
INSERT INTO item_organization 
("item_id",
"data_organization_name_text",
"data_organization_name_link")
VALUES
    (default, 'The Data Grid Database Generation Service', 'www.thedatagrid.org');

INSERT INTO item_user 
("item_id",
"data_first_name",
"data_last_name",
"data_email",
"tdg_p_hash",
"data_is_email_public",
"data_is_quarterly_updates",
"is_pending",
"privilege_id")
VALUES
    (default, 'Generated', 'User', 'user-generated@thedatagrid.org', $(hashedPassword), true, true, false, 2);

INSERT INTO tdg_role 
("role_id",
"role_type_id",
"item_organization_id",
"item_user_id")
VALUES
    (default, 2, 1, 1);

INSERT INTO item_audit 
("item_id",
"data_audit_name",
"item_user_id",
"item_organization_id",
"data_time_created")
VALUES
    (default, $(auditName), 1, 1, NOW());

INSERT INTO item_global
("item_id", "item_audit_id", "item_organization_id", "item_user_id")
VALUES
    (default, 1, 1, 1);