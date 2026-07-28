/**
 * Unique faker entrypoint for seed/mock generators.
 * Always Italian locale — never the default (en) dataset.
 */
import { fakerIT } from "@faker-js/faker";

export const faker = fakerIT;
