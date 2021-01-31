create table pro_continent
(
    id   serial      not null
        constraint pro_continent_pk
            primary key,
    name varchar(20) not null
);

alter table pro_continent
    add constraint pro_continent_name_uindex
        unique (name);

create table pro_country
(
    id           serial       not null
        constraint pro_country_pk
            primary key,
    continent_id integer      not null
        constraint pro_country_pro_continent_id_fk
            references pro_continent (id)
            on update cascade on delete restrict,
    name         varchar(200) not null
);

alter table pro_country
    add constraint pro_country_name_uindex unique (name);

create table pro_datapoint
(
    id               serial  not null
        constraint pro_datapoint_pk
            primary key,
    date             date    not null,
    country_id       integer not null
        constraint pro_datapoint_pro_country_id_fk
            references pro_country
            on update cascade on delete restrict,
    region           varchar(200),
    cases            integer,
    deaths           integer,
    hospitalizations integer,
    tests            integer
);


alter table pro_datapoint
    add constraint pro_datapoint_date_country_id_region_uindex unique (date, country_id, region);

create index pro_datapoint_date_index
    on pro_datapoint (date);

insert into pro_continent (id, name)
values (1, 'Europe');
insert into pro_continent (id, name)
values (2, 'North America');
insert into pro_continent (id, name)
values (3, 'South America');
insert into pro_continent (id, name)
values (4, 'Asia');
insert into pro_continent (id, name)
values (5, 'Australia');
insert into pro_continent (id, name)
values (6, 'Africa');
insert into pro_continent (id, name)
values (7, 'Antarctica');
