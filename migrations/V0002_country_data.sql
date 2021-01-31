alter table pro_country
    add column population bigint;
alter table pro_datapoint
    add column main_region bool;
alter table pro_datapoint
    add column data_source varchar(200);

alter table pro_datapoint
    alter column cases type bigint using cases::bigint;
alter table pro_datapoint
    alter column deaths type bigint using deaths::bigint;
alter table pro_datapoint
    alter column tests type bigint using tests::bigint;
alter table pro_datapoint
    alter column hospitalizations type bigint using hospitalizations::bigint;

update pro_continent
set name = 'Oceania'
where name = 'Australia';

insert into pro_continent (id, name)
values (0, 'World');
