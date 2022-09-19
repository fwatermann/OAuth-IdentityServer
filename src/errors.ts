
export type API_ERROR = {
    code: number,
    error: string,
    message: string,
    description?: string
    info?: any
}

export function BAD_REQUEST(message: string, description: string, info?: any) : API_ERROR {
    return {
        code: 400,
        error: "Bad Request",
        message: message,
        description: description,
        info: info
    }
}

export function UNAUTHORIZED(message: string, description: string, info?: any) : API_ERROR {
    return {
        code: 401,
        error: "Unauthorized",
        message: message,
        description: description,
        info: info
    }
}

export function NOT_FOUND(message: string, description: string, info?: any) : API_ERROR {
    return {
        code: 404,
        error: "Not Found",
        message: message,
        description: description,
        info: info
    }
}

export function INTERNAL_SERVER_ERROR(message: string, description: string, info?: any) : API_ERROR {
    return {
        code: 500,
        error: "Internal Server Error",
        message: message,
        description: description,
        info: info
    }
}
