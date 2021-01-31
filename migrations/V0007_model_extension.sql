alter table pro_prophet_model
    add rolling_sum_window int default 7;

alter table pro_prophet_model
    add seasonality_prior_scale double precision default 10.0 not null;

alter table pro_prophet_model
    add holidays_prior_scale double precision default 10.0 not null;

alter table pro_prophet_model
    add seasonality_mode varchar(20) default 'additive' not null;

alter table pro_prophet_model
    alter column change_point_range type double precision using change_point_range::double precision;
