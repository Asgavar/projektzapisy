-- Nuke IBANs
UPDATE users_studiazamawiane SET bank_account='';

-- Anonymize first/last names
UPDATE auth_user SET first_name=CONCAT('user_',id);
UPDATE auth_user SET last_name=CONCAT('user_',id);

-- Anonymize/remove email addresses
UPDATE auth_user SET email='email@example.org';
DELETE FROM mailer_message;
DELETE FROM mailer_messagelog;

-- Make sure everyone has the same simple password, in this case, 'pass'
-- See here: https://docs.djangoproject.com/en/2.0/topics/auth/passwords/
UPDATE auth_user SET password='pbkdf2_sha256$36000$Z6GlerjZ9cWC$M6zn6XGPc81913R1yw6SMouredUfO/DPnQwZ3XxUCnA=';

-- Anonymize grade/poll answers
UPDATE poll_openquestionanswer SET content = 'jakas ocena';
DELETE FROM poll_singlechoicequestionanswer;