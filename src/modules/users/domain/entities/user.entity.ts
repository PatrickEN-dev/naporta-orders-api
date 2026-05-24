import { Entity } from '../../../../shared/domain/entity.base';

interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  refreshTokenHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity {
  readonly email: string;
  readonly passwordHash: string;
  readonly refreshTokenHash: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: UserProps) {
    super(props.id);
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.refreshTokenHash = props.refreshTokenHash;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static restore(props: UserProps): User {
    return new User(props);
  }
}
