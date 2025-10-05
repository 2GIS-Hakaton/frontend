// Категории достопримечательностей для 2GIS API

export const POI_CATEGORIES = [
  {
    id: 168,
    value: 'attractions',
    label: 'Достопримечательности',
    icon: '🏛️',
    description: 'Исторические места и памятники архитектуры',
  },
  {
    id: 220,
    value: 'museums',
    label: 'Музеи',
    icon: '🖼️',
    description: 'Музеи и галереи',
  },
  {
    id: 221,
    value: 'theatres',
    label: 'Театры',
    icon: '🎭',
    description: 'Театры и концертные залы',
  },
  {
    id: 222,
    value: 'parks',
    label: 'Парки',
    icon: '🌳',
    description: 'Парки и зоны отдыха',
  },
];

// Получить ID рубрик из выбранных категорий
export function getSelectedRubricIds(selectedCategories) {
  if (!selectedCategories || selectedCategories.length === 0) {
    // Если ничего не выбрано, возвращаем все категории
    return POI_CATEGORIES.map(cat => cat.id);
  }
  
  return POI_CATEGORIES
    .filter(cat => selectedCategories.includes(cat.value))
    .map(cat => cat.id);
}

// Получить категории для отправки в API
export function getCategoriesForAPI(selectedCategories) {
  if (!selectedCategories || selectedCategories.length === 0) {
    return POI_CATEGORIES.map(cat => cat.value);
  }
  
  return selectedCategories;
}
