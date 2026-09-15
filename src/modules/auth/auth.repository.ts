import { injectable } from "inversify";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { User } from "@/database/models/User";
import { AuthRelations, AuthSelectFull } from "./auth.select";

@injectable()
export class AuthRepository extends BaseRepository<User> {
    protected entityClass = User;
    protected selectedFields = AuthSelectFull;
    protected relations = AuthRelations;

    async findByIdentifier(identifier: string): Promise<User | null> {
        const repo = this.getRepository();
        if (!repo) {
            throw new Error(
                "Repository not initialized - database connection may not be ready",
            );
        }
        return await repo.findOne({
            where: [
                { email: identifier },
                { phone: identifier },
                { username: identifier },
            ],
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.getRepository().findOne({
            where: { email },
        });
    }

    async findByUsername(username: string): Promise<User | null> {
        return await this.getRepository().findOne({
            where: { username },
        });
    }

    async findByPhone(phone: string): Promise<User | null> {
        return await this.getRepository().findOne({
            where: { phone },
        });
    }

    async updateRefreshToken(
        userId: string,
        refreshToken: string | null,
    ): Promise<void> {
        await this.getRepository().update(userId, {
            refreshToken: refreshToken || undefined,
        } as any);
    }
}
