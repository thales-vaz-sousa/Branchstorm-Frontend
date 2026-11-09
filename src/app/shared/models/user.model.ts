export interface UserResult {
  readonly code: string;
  readonly name: string;
  readonly email: string;
}

export interface CreateUserRequest {
  readonly name: string;
  readonly email: string;
}

export interface FindUsersQuery {
  readonly code?: string;
  readonly name?: string;
  readonly email?: string;
  readonly codes?: readonly string[];
}
