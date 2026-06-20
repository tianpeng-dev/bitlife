import type { P1Catalog } from "../schema";

export const generatedPets = [
  {
    id: "p1_pet_cat",
    nameKey: "p1.pet.cat.name",
    species: "cat",
    minPrice: 25,
    maxPrice: 500,
    lifespan: 18,
    source: "generated:p1:pets"
  },
  {
    id: "p1_pet_small_dog",
    nameKey: "p1.pet.small_dog.name",
    species: "small_dog",
    minPrice: 150,
    maxPrice: 1200,
    lifespan: 16,
    source: "generated:p1:pets"
  },
  {
    id: "p1_pet_large_dog",
    nameKey: "p1.pet.large_dog.name",
    species: "large_dog",
    minPrice: 250,
    maxPrice: 1800,
    lifespan: 13,
    source: "generated:p1:pets"
  },
  {
    id: "p1_pet_parrot",
    nameKey: "p1.pet.parrot.name",
    species: "parrot",
    minPrice: 400,
    maxPrice: 2500,
    lifespan: 60,
    source: "generated:p1:pets"
  },
  {
    id: "p1_pet_rabbit",
    nameKey: "p1.pet.rabbit.name",
    species: "rabbit",
    minPrice: 35,
    maxPrice: 250,
    lifespan: 10,
    source: "generated:p1:pets"
  }
] satisfies P1Catalog["pets"];
