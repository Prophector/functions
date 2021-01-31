create table pro_user
(
    id               serial       not null
        constraint pro_user_pk
            primary key,
    provider_user_id varchar(200) not null,
    email            varchar      not null,
    enabled          bool         not null,
    display_name     varchar      not null,
    created_date     date         not null,
    modified_date    date         not null,
    role             varchar(20)  not null,
    password         varchar      not null,
    provider         varchar      not null
);
