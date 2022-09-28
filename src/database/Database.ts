import Config from "../config/config.json";
import {DataTypes, Deferrable, InferAttributes, InferCreationAttributes, Model, Sequelize} from "sequelize";

const sequelize = new Sequelize({
    host: Config.database.host,
    port: Config.database.port,
    database: Config.database.database,
    username: Config.database.username,
    password: Config.database.password,
    dialect: "mysql",
    logging: false,
    pool: {
        max: 10,
        min: 1,
        acquire: 60000,
        idle: 10000
    }
})

export class OAuth__User extends Model<InferAttributes<OAuth__User>, InferCreationAttributes<OAuth__User>> {
    userId?: string;
    username: string;
    displayName: string;
    password: string;
    email: string;
    mfa: boolean;
    mfa_secret?: string;
    permissions?: {permission: string}[]
    createdAt?: Date;
    updatedAt?: Date;
}

export class OAuth__UserPermission extends Model<InferAttributes<OAuth__UserPermission>, InferCreationAttributes<OAuth__UserPermission>> {
    Id?: string;
    permission: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class OAuth__Client extends Model<InferAttributes<OAuth__Client>, InferCreationAttributes<OAuth__Client>> {
    clientId?: string;
    clientSecret: string;
    clientName: string;
    clientDescription: string;
    trusted: boolean;
    clientOwner?: string;
    redirectURIs?: {redirectURI: string}[]
    createdAt?: Date;
    updatedAt?: Date;
}

export class OAuth__ClientURI extends Model<InferAttributes<OAuth__ClientURI>, InferCreationAttributes<OAuth__ClientURI>> {
    Id?: string;
    redirectURI: string;
    clientId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class OAuth__Scope extends Model<InferAttributes<OAuth__Scope>, InferCreationAttributes<OAuth__Scope>> {
    scopeId?: string;
    scope: string;
    name?: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class OAuth__Token extends Model<InferAttributes<OAuth__Token>, InferCreationAttributes<OAuth__Token>> {
    tokenId?: string;
    token: string;
    tokenType: "userAccess"|"clientAccess"|"userRefresh";
    tokenExpires: Date;
    tokenScopes?: {scope: string}[];
    clientId: string;
    userId: string;
    refreshTokenId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class OAuth__TokenScope extends Model<InferAttributes<OAuth__TokenScope>, InferCreationAttributes<OAuth__TokenScope>> {
    tokenId: string;
    scopeId: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class OAuth__AuthCode extends Model<InferAttributes<OAuth__AuthCode>, InferCreationAttributes<OAuth__AuthCode>> {
    authCodeId?: string;
    authCode: string;
    authCodeExpires?: Date;
    authCodeScopes?: {scope: string}[];
    userId: string;
    clientId: string;
    redirectURIId: string;
    redirectURI?: {redirectURI: string};
    createdAt?: Date;
    updatedAt?: Date;
}

export class OAuth__AuthCodeScope extends Model<InferAttributes<OAuth__AuthCodeScope>, InferCreationAttributes<OAuth__AuthCodeScope>> {
    authCodeId: string;
    scopeId: string;
    createdAt?: Date;
    updatedAt?: Date;
}

OAuth__User.init({
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
    }
}, {sequelize: sequelize});

OAuth__UserPermission.init({
    Id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    permission: {
        type: DataTypes.STRING,
        primaryKey: true
    }
}, {sequelize: sequelize});

OAuth__Client.init({
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
    trusted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
}, {sequelize: sequelize});

OAuth__ClientURI.init({
    Id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    redirectURI: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {sequelize: sequelize});

OAuth__Scope.init({
    scopeId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    scope: {
        type: DataTypes.STRING,
        unique: true
    },
    name: {
        type: DataTypes.STRING
    },
    description: {
        type: DataTypes.STRING
    }
}, {sequelize: sequelize});

OAuth__Token.init({
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
    tokenExpires: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("(current_timestamp + interval 4 hour)")
    },
    clientId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    refreshTokenId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {sequelize: sequelize});

OAuth__TokenScope.init({
    tokenId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: {
            model: OAuth__Token,
            key: "tokenId"
        }
    },
    scopeId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: {
            model: OAuth__Scope,
            key: "scopeId"
        }
    }
}, {sequelize: sequelize});

OAuth__AuthCode.init({
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
    authCodeExpires: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("(current_timestamp + interval 1 hour)")
    },
    redirectURIId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    clientId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {sequelize: sequelize});

OAuth__AuthCodeScope.init({
    authCodeId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: {
            model: OAuth__AuthCode,
            key: "authCodeId"
        }
    },
    scopeId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: {
            model: OAuth__Scope,
            key: "scopeId"
        }
    }
}, { sequelize: sequelize });

export const ASSOCIATION_OAuth__User_UserPermission = OAuth__User.hasMany(OAuth__UserPermission, {
    foreignKey: {
        name: "userId"
    },
    as: "permissions",
    onDelete: "cascade",
    onUpdate: "cascade",
});

export const ASSOCIATION_OAuth__Client_User = OAuth__Client.belongsTo(OAuth__User, {
    foreignKey: {
        name: "clientOwner",
        allowNull: true
    },
    onUpdate: "cascade",
    onDelete: "cascade"
});
export const ASSOCIATION_OAuth__Client_URI = OAuth__Client.hasMany(OAuth__ClientURI, {
    foreignKey: {
        name: "clientId"
    },
    as: "redirectURIs",
    onDelete: "cascade",
    onUpdate: "cascade"
});

export const ASSOCIATION_OAuth__Scope_Token = OAuth__Scope.belongsToMany(OAuth__Token, {
    through: {
        model: OAuth__TokenScope
    },
    foreignKey: "scopeId",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});
export const ASSOCIATION_OAuth__Scope_AuthCode = OAuth__Scope.belongsToMany(OAuth__AuthCode, {
    through: {
        model: OAuth__AuthCodeScope
    },
    foreignKey: "scopeId",
    as: "authCodeScopes"
});

export const ASSOCIATION_OAuth__Token_Scope = OAuth__Token.belongsToMany(OAuth__Scope, {
    through: {
        model: OAuth__TokenScope
    },
    foreignKey: "tokenId",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});
export const ASSOCIATION_OAuth__Token_Token = OAuth__Token.belongsTo(OAuth__Token, {
    foreignKey: {
        name: "refreshTokenId"
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});
export const ASSOCIATION_OAuth__Token_Client = OAuth__Token.belongsTo(OAuth__Client, {
    foreignKey: {
        name: "clientId"
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});
export const ASSOCIATION_OAuth__Token__User = OAuth__Token.belongsTo(OAuth__User, {
    foreignKey: {
        name: "userId"
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

export const ASSOCIATION_OAuth__AuthCode_Scope = OAuth__AuthCode.belongsToMany(OAuth__Scope, {
    through: {
        model: OAuth__AuthCodeScope
    },
    foreignKey: "authCodeId",
    as: "authCodeScopes"
});
export const ASSOCIATION_OAuth__AuthCode_Client = OAuth__AuthCode.belongsTo(OAuth__Client, {
    foreignKey: "clientId",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});
export const ASSOCIATION_OAuth__AuthCode_User = OAuth__AuthCode.belongsTo(OAuth__User, {
    foreignKey: "userId",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});
export const ASSOCIATION_OAuth__AuthCode_URI = OAuth__AuthCode.belongsTo(OAuth__ClientURI, {
    foreignKey: "redirectURIId",
    as: "redirectURI",
    onUpdate: "NO ACTION",
    onDelete: "CASCADE"
});

export function init() {
    sequelize.authenticate().then(async () => {
        await sequelize.sync();
        console.log(`Connected to ${Config.database.database}@${Config.database.host}:${Config.database.port} successfully`);
    }).catch((error) => {
        console.error(`Could not connect to ${Config.database.database}@${Config.database.host}:${Config.database.port}: `, error);
    });
}
