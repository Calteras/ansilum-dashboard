export interface RecipeItem {
  id: string
  ingredientId: string
  ingredientCode: string
  ingredientName: string
  quantity: number | string
  unit: string
  costPerUnit: number | string
  lineCost: number
  availableStock: number | string
  notes?: string | null
}

export interface ProductRecipe {
  productId: string
  productName: string
  productSku: string
  productType: string
  basePrice: number | string
  totalCogs: number
  profitMargin: number
  items: RecipeItem[]
}

export interface CreateRecipeItemRequest {
  ingredientId: string
  quantity: number
  unit: string
}

export interface CreateRecipeRequest {
  productId: string
  items: CreateRecipeItemRequest[]
}

export interface ProductRecipeResponse {
  data: ProductRecipe
  meta: {
    page: number
    size: number
    totalData: number
    totalPages: number
  }
}
