import { BaseRepository } from "@/shared/base/BaseRepository";
import { AttributeSelectFull, AttributeRelations } from "./attribute.select";
import {
    Attribute,
    AttributeSnapshot,
    AttributeTypeEnum,
} from "@/database/models/Attribute";
import { EntityManager } from "typeorm";

type AttributesByAncestor = Attribute & {
    familyIds: string[];
};

/**
 * Attribute Repository -  Entity
 * Sử dụng BaseRepository để truy vấn trên tenant schemas
 */
export class AttributeRepository extends BaseRepository<Attribute> {
    protected entityClass = Attribute;
    protected selectedFields = AttributeSelectFull;
    protected relations = AttributeRelations;

    /**
     * Find by type
     */
    findByType(type: AttributeTypeEnum): Promise<Attribute[]> {
        const repo = this.getRepository();
        return repo.find({
            where: { type },
            order: { createdAt: "ASC" },
        });
    }
    async getSnapshot(
        id?: string | null,
        manager?: EntityManager,
    ): Promise<AttributeSnapshot | null> {
        if (!id) return null;
        const attribute = await this.findById(id, manager);
        if (!attribute) return null;
        return {
            id: attribute.id,
            name: attribute.name,
            code: attribute.code,
            type: attribute.type,
        };
    }
}
