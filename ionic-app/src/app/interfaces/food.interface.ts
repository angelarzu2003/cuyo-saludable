/** Categorías de alimentos (columna foods.category de la BD). */
export type FoodCategory = 'heno' | 'agua' | 'verdura' | 'pellet' | 'fruta' | 'prohibido';

/** Alimento del catálogo (api/foods.php). */
export interface Food {
  id: number;
  name: string;
  emoji: string;
  category: FoodCategory;
  portion_size: string;
  vitamin_c_mg: number;
}

/** Sección del formulario "carrito": agrupa categorías de alimentos. */
export interface FoodSection {
  title: string;
  hint: string;
  categories: FoodCategory[];
  isDanger?: boolean;
  foods: Food[];
}
