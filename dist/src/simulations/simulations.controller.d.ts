import { AutoSimulationDto } from "./dto/auto-simulation.dto";
import { GenericSimulationDto } from "./dto/generic-simulation.dto";
import { SimulationsService } from "./simulations.service";
export declare class SimulationsController {
    private readonly simulationsService;
    constructor(simulationsService: SimulationsService);
    simulateAuto(dto: AutoSimulationDto): Promise<{
        input: any;
        count: number;
        results: {
            id: string;
            insurer: string;
            insurerSlug: string;
            logoUrl: string | null;
            offerId: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            guarantees: string[];
            tag: string | null | undefined;
            rating: import("@prisma/client/runtime/library").Decimal | undefined;
            details: {
                coverageAmount: import("@prisma/client/runtime/library").Decimal;
                franchise: import("@prisma/client/runtime/library").Decimal;
                waitingPeriod: string;
                duration: string;
                guarantees: {
                    name: string;
                    included: boolean;
                    details: string | null;
                }[];
            } | null;
        }[];
    }>;
    simulateGeneric(dto: GenericSimulationDto): Promise<{
        input: any;
        count: number;
        results: {
            id: string;
            insurer: string;
            insurerSlug: string;
            logoUrl: string | null;
            offerId: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            guarantees: string[];
            tag: string | null | undefined;
            rating: import("@prisma/client/runtime/library").Decimal | undefined;
            details: {
                coverageAmount: import("@prisma/client/runtime/library").Decimal;
                franchise: import("@prisma/client/runtime/library").Decimal;
                waitingPeriod: string;
                duration: string;
                guarantees: {
                    name: string;
                    included: boolean;
                    details: string | null;
                }[];
            } | null;
        }[];
    }>;
}
