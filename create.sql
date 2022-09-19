CREATE TABLE IF NOT EXISTS OAuth__User(
    userId varchar(36) primary key default (uuid()),
    username varchar(32) not null unique,
    displayName varchar(64) not null,
    password varchar(64) not null,
    email varchar(320) not null unique,
    created timestamp default current_timestamp,
    updated timestamp default current_timestamp on update current_timestamp
);

CREATE TABLE IF NOT EXISTS OAuth__Client(
    clientId varchar(36) primary key default (uuid()),
    clientSecret varchar(32) not null,
    clientName varchar(256) not null,
    clientDescription varchar(1024) not null,
    clientOwner varchar(36),
    trusted tinyint(1) default 0 not null,
    created timestamp default current_timestamp,
    updated timestamp default current_timestamp on update current_timestamp,
    foreign key (clientOwner) references OAuth__User(userId) on delete cascade on update cascade
);

CREATE TABLE IF NOT EXISTS OAuth__ClientURIs(
    clientId varchar(36),
    redirectURI varchar(384) not null,
    created timestamp default current_timestamp,
    updated timestamp default current_timestamp on update current_timestamp,
    foreign key (clientId) references OAuth__Client(clientId) on delete cascade on update cascade
);

CREATE TABLE IF NOT EXISTS OAuth__Tokens(
    tokenId varchar(36) primary key default (uuid()),
    token varchar(32) not null unique,
    tokenType varchar(16) not null,
    refreshToken varchar(36),
    tokenExpires timestamp not null default (current_timestamp + interval 4 hour),
    tokenScope varchar(256) not null,
    tokenClient varchar(36) not null,
    tokenUser varchar(36) default NULL,
    created timestamp default current_timestamp,
    updated timestamp default current_timestamp on update current_timestamp,
    foreign key (tokenClient) references OAuth__Client(clientId) on delete cascade on update cascade,
    foreign key (tokenUser) references OAuth__User(userId) on delete cascade on update cascade,
    foreign key (refreshToken) references OAuth__Tokens(tokenId) on delete cascade on update cascade
);

CREATE TABLE IF NOT EXISTS OAuth__AuthCodes(
    authCodeId varchar(36) primary key default (uuid()),
    authCode varchar(32) not null unique,
    authCodeRedirectURI varchar(384) not null,
    authCodeExpires timestamp not null default (current_timestamp + interval 1 hour),
    authCodeScope varchar(256) not null,
    authCodeClient varchar(36) not null,
    authCodeUser varchar(36) default NULL,
    created timestamp default current_timestamp,
    updated timestamp default current_timestamp on update current_timestamp,
    foreign key (authCodeClient) references OAuth__Client(clientId) on delete cascade on update cascade,
    foreign key (authCodeUser) references OAuth__User(userId) on delete cascade on update cascade
);

CREATE TABLE IF NOT EXISTS UserSession(
    sessionId varchar(36) primary key default (uuid()),
    sessionUser varchar(36) not null,
    sessionExpires timestamp not null default (current_timestamp + interval 7 day),
    created timestamp default current_timestamp,
    updated timestamp default current_timestamp on update current_timestamp,
    foreign key (sessionUser) references OAuth__User(userId) on delete cascade on update cascade
);

CREATE TABLE IF NOT EXISTS UserSessionStore(
    sessionId varchar(36) not null,
    storeKey varchar(32) not null,
    storeValue varchar(512) not null,
    created timestamp default current_timestamp,
    updated timestamp default current_timestamp on update current_timestamp,
    primary key (sessionId, storeKey),
    foreign key (sessionId) references UserSession(sessionId) on delete cascade on update cascade
);
