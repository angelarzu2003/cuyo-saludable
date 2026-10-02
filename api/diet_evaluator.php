<?php
// =========================================
// Reglas para evaluar la dieta diaria de un cuyo adulto.
// Se parte de 100 puntos y cada regla que no se cumple resta puntos.
// =========================================

const MIN_VEGETABLE_PORTIONS = 3;
const MAX_VEGETABLE_PORTIONS = 6;
const MAX_PELLET_PORTIONS = 2;
const MAX_FRUIT_PORTIONS = 2;
const MIN_VITAMIN_C_MG = 10;   // Los cuyos no producen vitamina C: necesitan 10-30 mg al día
const FORBIDDEN_PENALTY = 25;  // Puntos que resta CADA alimento prohibido
const MAX_PORTIONS_PER_FOOD = 10;

/**
 * Evalúa los alimentos elegidos por el usuario.
 *
 * @param array $items Filas de la tabla foods, cada una con su 'quantity' (porciones elegidas).
 * @return array ['score' => 0-100, 'level' => string, 'feedback' => [['type', 'text'], ...]]
 */
function evaluate_diet(array $items): array
{
    // --- 1. Totalizar porciones por categoría, vitamina C y prohibidos ---
    $portions = array_fill_keys(['heno', 'agua', 'verdura', 'pellet', 'fruta', 'prohibido'], 0);
    $vitaminC = 0;
    $forbidden = [];

    foreach ($items as $item) {
        $portions[$item['category']] += $item['quantity'];
        $vitaminC += $item['vitamin_c_mg'] * $item['quantity'];

        if ($item['category'] === 'prohibido') {
            $forbidden[] = $item['name'];
        }
    }

    // --- 2. Aplicar las reglas ---
    $score = 100;
    $feedback = [];

    // Heno: la base de su dieta
    if ($portions['heno'] > 0) {
        $feedback[] = message('ok', 'Tiene heno, la base de su dieta y clave para desgastar sus dientes.');
    } else {
        $score -= 35;
        $feedback[] = message('danger', 'Falta heno: debe ser el 80 % de su dieta y estar siempre disponible.');
    }

    // Agua
    if ($portions['agua'] > 0) {
        $feedback[] = message('ok', 'Tiene agua fresca disponible.');
    } else {
        $score -= 20;
        $feedback[] = message('danger', 'Falta agua: siempre debe tener agua fresca y limpia.');
    }

    // Verduras
    if ($portions['verdura'] < MIN_VEGETABLE_PORTIONS) {
        $score -= 15;
        $feedback[] = message('warning', 'Pocas verduras: ofrécele de 3 a 6 porciones al día.');
    } elseif ($portions['verdura'] > MAX_VEGETABLE_PORTIONS) {
        $score -= 10;
        $feedback[] = message('warning', 'Demasiadas verduras: en exceso pueden causarle diarrea.');
    } else {
        $feedback[] = message('ok', 'Cantidad de verduras adecuada.');
    }

    // Pellets
    if ($portions['pellet'] === 0) {
        $score -= 5;
        $feedback[] = message('warning', 'Una cucharada de pellets al día complementa su nutrición.');
    } elseif ($portions['pellet'] > MAX_PELLET_PORTIONS) {
        $score -= 10;
        $feedback[] = message('warning', 'Exceso de pellets: puede causarle sobrepeso.');
    } else {
        $feedback[] = message('ok', 'Porción de pellets correcta.');
    }

    // Frutas (son opcionales, solo se castiga el exceso)
    if ($portions['fruta'] > MAX_FRUIT_PORTIONS) {
        $score -= 10;
        $feedback[] = message('warning', 'Demasiada fruta: su azúcar favorece la obesidad. Máximo 2 porciones.');
    } elseif ($portions['fruta'] > 0) {
        $feedback[] = message('ok', 'La fruta está en una cantidad sana, como premio.');
    }

    // Vitamina C
    $vitaminCText = round($vitaminC) . ' mg';
    if ($vitaminC < MIN_VITAMIN_C_MG) {
        $score -= 15;
        $feedback[] = message('danger', "Vitamina C insuficiente ({$vitaminCText}). Necesita al menos 10 mg al día: prueba con pimiento o perejil.");
    } else {
        $feedback[] = message('ok', "Buen aporte de vitamina C ({$vitaminCText}).");
    }

    // Alimentos prohibidos
    if (count($forbidden) > 0) {
        $score -= FORBIDDEN_PENALTY * count($forbidden);
        $feedback[] = message('danger', 'Alimentos tóxicos para tu cuyo: ' . implode(', ', $forbidden) . '.');
    }

    // --- 3. Resultado final ---
    $score = max(0, $score);

    return [
        'score' => $score,
        'level' => diet_level($score),
        'feedback' => $feedback,
    ];
}

/** Traduce el puntaje a un nivel de salud. */
function diet_level(int $score): string
{
    return match (true) {
        $score >= 85 => 'excelente',
        $score >= 60 => 'buena',
        $score >= 35 => 'regular',
        default => 'peligro',
    };
}

/** Crea un mensaje de retroalimentación. $type: 'ok' | 'warning' | 'danger'. */
function message(string $type, string $text): array
{
    return ['type' => $type, 'text' => $text];
}
