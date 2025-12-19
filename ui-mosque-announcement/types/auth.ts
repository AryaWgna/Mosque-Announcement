export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginSuccessResponse {
    success: true;
    message: string;
    data: {
        user: User;
        token: string;
        token_type: string;
    };
}

export interface LoginErrorResponse {
    success: false;
    message: string;
}

export type LoginResponse = LoginSuccessResponse | LoginErrorResponse;

export interface LogoutResponse {
    success: boolean;
    message: string;
}
