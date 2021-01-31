create table pro_prophet_model
(
    id                       serial           not null
        constraint pro_prophet_model_pk
            primary key,
    name                     varchar(200)     not null,
    description              varchar          not null,
    status                   varchar(20)      not null,
    owner_id                 integer          not null
        constraint pro_prophet_model_pro_user_id_fk
            references pro_user
            on update cascade on delete cascade,
    country_id               integer          not null
        constraint pro_prophet_model_pro_country_id_fk
            references pro_country
            on update cascade on delete cascade,
    type                     varchar(20)      not null,
    display_type             varchar(20)      not null,
    smoothing                integer          not null,
    days_to_look_back        integer          not null,
    num_change_points        integer          not null,
    change_point_prior_scale double precision not null,
    change_point_range       integer          not null,
    add_country_holidays     boolean          not null
);

create table pro_prophet_model_change_point
(
    id       serial  not null
        constraint pro_prophet_model_change_point_pk
            primary key,
    date     date    not null,
    model_id integer not null
        constraint pro_prophet_model_change_point_pro_prophet_model_id_fk
            references pro_prophet_model
            on update cascade on delete cascade
);

create table pro_datapoint_prediction
(
    id              serial           not null
        constraint pro_datapoint_prediction_pk
            primary key,
    model_id        integer          not null
        constraint pro_datapoint_prediction_pro_prophet_model_id_fk
            references pro_prophet_model
            on update cascade on delete cascade,
    date            date             not null,
    upper_bound     double precision not null,
    y_hat           double precision not null,
    lower_bound     double precision not null,
    is_change_point boolean          not null
);

create table pro_prophet_job
(
    id                  serial      not null
        constraint pro_prophet_job_pk
            primary key,
    model_id            integer     not null
        constraint pro_prophet_job_pro_prophet_model_id_fk
            references pro_prophet_model
            on update cascade on delete cascade,
    job_status          varchar(20) not null,
    submitted_timestamp timestamp   not null,
    started_timestamp   timestamp,
    finished_timestamp  timestamp,
    error_reason        varchar
);
