import Config from "../config/config.json";
import {DataTypes, Deferrable, InferAttributes, InferCreationAttributes, Model, Sequelize} from "sequelize";

const sequelize = new Sequelize({
    host: Config.database.host,
    port: Config.database.port,
    database: Config.database.database,
    username: Config.database.username,
    password: Config.database.password,
    dialect: "mysql",
    logging: console.log,
})

export interface OAuth__User extends Model<InferAttributes<OAuth__User>, InferCreationAttributes<OAuth__User>> {
    userId: string;
    username: string;
    displayName: string;
    password: string;
    email: string;
    mfa: boolean;
    mfa_secret: string;
    permissions: string;
}

export interface OAuth__Client extends Model<InferAttributes<OAuth__Client>, InferCreationAttributes<OAuth__Client>> {
    clientId: string;
    clientSecret: string;
    clientName: string;
    clientDescription: string;
    clientOwner: string;
    trusted: boolean
}

export interface OAuth__ClientURIs extends Model<InferAttributes<OAuth__ClientURIs>, InferCreationAttributes<OAuth__ClientURIs>> {
    clientId: string;
    redirectURI: string;
}

export interface OAuth__Token extends Model<InferAttributes<OAuth__Token>, InferCreationAttributes<OAuth__Token>> {
    tokenId: string;
    token: string;
    tokenType: "userAccess"|"clientAccess"|"userRefresh";
    refreshToken: string;
    tokenExpires: Date;
    tokenScope: string;
    tokenClient: string;
    tokenUser: string;
}

export interface OAuth__AuthCode extends Model<InferAttributes<OAuth__AuthCode>, InferCreationAttributes<OAuth__AuthCode>> {
    authCodeId: string;
    authCode: string;
    authCodeRedirectURI: string;
    authCodeExpires: Date;
    authCodeScope: string;
    authCodeClient: string;
    authCodeUser: string;
}

export const OAuth__User = sequelize.define<OAuth__User>("OAuth__User", {
    userId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    displayName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    mfa: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    mfa_secret: {
        type: DataTypes.STRING
    },
    permissions: {
        type: DataTypes.JSON,
        defaultValue: {}
    }
});

export const OAuth__Client = sequelize.define<OAuth__Client>("OAuth__Client", {
    clientId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    clientSecret: {
        type: DataTypes.STRING(32),
        allowNull: false
    },
    clientName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    clientDescription: {
        type: DataTypes.TEXT
    },
    clientOwner: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: OAuth__User,
            key: "userId",
            deferrable: Deferrable.INITIALLY_IMMEDIATE()
        }
    },
    trusted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
});

export const OAuth__ClientURIs = sequelize.define<OAuth__ClientURIs>("OAuth__ClientURIs", {
    clientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: OAuth__Client,
            key: "clientId"
        }
    },
    redirectURI: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

export const OAuth__Token = sequelize.define<OAuth__Token>("OAuth__Token", {
    tokenId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    token: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true
    },
    tokenType: {
        type: DataTypes.ENUM("userAccess", "clientAccess", "userRefresh"),
        allowNull: false
    },
    refreshToken: {
        type: DataTypes.UUID,
        references: {
            key: "tokenId"
        }
    },
    tokenExpires: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("(current_timestamp + interval 4 hour)")
    },
    tokenScope: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tokenClient: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: OAuth__Client,
            key: "clientId"
        }
    },
    tokenUser: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: OAuth__User,
            key: "userId"
        }
    }
});

export const OAuth__AuthCode = sequelize.define<OAuth__AuthCode>("OAuth__AuthCode", {
    authCodeId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    authCode: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true
    },
    authCodeRedirectURI: {
        type: DataTypes.STRING,
        allowNull: false
    },
    authCodeExpires: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("(current_timestamp + interval 1 hour)")
    },
    authCodeScope: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    authCodeClient: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: OAuth__Client,
            key: "clientId"
        }
    },
    authCodeUser: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: OAuth__User,
            key: "userId"
        }
    }
});

export function init() {
    sequelize.authenticate().then(() => {
        console.log(`Connected to ${Config.database.database}@${Config.database.host}:${Config.database.port} successfully`);
    }).catch((error) => {
        console.error(`Could not connect to ${Config.database.database}@${Config.database.host}:${Config.database.port}: `, error);
    });
}
