import camelcaseKeys from 'camelcase-keys';
import { config } from 'dotenv-safe';
import postgres from 'postgres';

// Read the environment variables from the .env
// file, which will then be available for all
// following code
config();

// Type needed for the connection function below
declare module globalThis {
  let postgresSqlClient: ReturnType<typeof postgres> | undefined;
}

// Connect only once to the database
// https://github.com/vercel/next.js/issues/7811#issuecomment-715259370
function connectOneTimeToDatabase() {
  // When in development, connect only once to the database
  if (!globalThis.postgresSqlClient) {
    globalThis.postgresSqlClient = postgres();
  }
  const sql = globalThis.postgresSqlClient;

  return sql;
}

// Connect to PostgreSQL
const sql = connectOneTimeToDatabase();

export type Animal = {
  id: number;
  firstName: string;
  age: number;
  type: string;
  accessory: string;
};

export async function getAnimals() {
  const animals = await sql<Animal[]>`
    SELECT * FROM animals;
  `;
  return animals.map((animal) => camelcaseKeys(animal));
}

export async function getAnimalById(id: number) {
  const [animal] = await sql<[Animal | undefined]>`
    SELECT * FROM animals WHERE id = ${id};
  `;
  return animal && camelcaseKeys(animal);
}

// Example of a join query
export async function getAnimalWithFoodsById(animalId: number) {
  const animalFavoriteFoods = await sql`
    SELECT
      -- Specify all information from tables
      animals.id as animal_id,
      animals.first_name as animal_first_name,
      animals.age as animal_age,
      animals.type as animal_type,
      animals.accessory as animal_accessory,
      foods.id as food_id,
      foods.name as food_name,
      foods.type as food_type
    FROM
      -- Specify all of the tables that you need information from
      animals,
      animal_favorite_foods,
      foods
    WHERE
      -- "Join" the tables together
      animals.id = ${animalId} AND
      animals.id = animal_favorite_foods.animal_id AND
      animal_favorite_foods.food_id = foods.id
  `;
  return animalFavoriteFoods.map((animalFavoriteFood) =>
    camelcaseKeys(animalFavoriteFood),
  );
}

export async function createAnimal(
  firstName: string,
  age: number,
  type: string,
  accessory: string,
) {
  const [animal] = await sql<[Animal]>`
    INSERT INTO animals
      (first_name, age, type, accessory)
    VALUES
      (${firstName}, ${age}, ${type}, ${accessory})
    RETURNING *
  `;
  return camelcaseKeys(animal);
}

export async function updateAnimalById(
  id: number,
  firstName: string,
  age: number,
  type: string,
) {
  const [animal] = await sql<[Animal | undefined]>`
    UPDATE
      animals
    SET
      first_name = ${firstName},
      age = ${age},
      type = ${type}
    WHERE
      id = ${id}
    RETURNING *
  `;
  return animal && camelcaseKeys(animal);
}

export async function deleteAnimalById(id: number) {
  const [animal] = await sql<[Animal | undefined]>`
    DELETE FROM
      animals
    WHERE
      id = ${id}
    RETURNING *
  `;
  return animal && camelcaseKeys(animal);
}

// const animalsDatabase = [
//   {
//     id: '1',
//     name: 'Tiny',
//     age: 47,
//     type: 'Dragon',
//     accessory: 'Monacle',
//   },
//   {
//     id: '2',
//     name: 'Pete',
//     age: 4,
//     type: 'Iguana',
//     accessory: 'Top Hat',
//   },
//   {
//     id: '3',
//     name: 'Randolph',
//     age: 9,
//     type: 'Parakeet',
//     accessory: 'Ring',
//   },
//   {
//     id: '4',
//     name: 'George',
//     age: 2,
//     type: 'Tiger',
//     accessory: 'Gold Chain',
//   },
//   {
//     id: '5',
//     name: 'Lila',
//     age: 17,
//     type: 'Monkey',
//     accessory: 'Covid Mask',
//   },
//   {
//     id: '6',
//     name: 'Suchi',
//     age: 20,
//     type: 'Bunny',
//     accessory: 'Sword',
//   },
//   {
//     id: '7',
//     name: 'Susi',
//     age: 28,
//     type: 'Wombat',
//     accessory: 'Cane',
//   },
//   {
//     id: '8',
//     name: 'Lulu',
//     age: 21,
//     type: 'Dog',
//     accessory: 'Cane',
//   },
// ];

// export default animalsDatabase;
