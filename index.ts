import {
    Producto
} from "./src/types/models.ts";

import {
    filtrarProductosConStockBajo
} from "./src/utils/collections.ts";

const productos: Producto[] = [
{
    id: "P015",
    nombre: "Ropero de Madera",
    categoria: "Muebles",
    precio: 500,
    moneda: "USD",
    disponibleEnEspana: true,
    disponibleEnEEUU: true,
    cantidadStock: 4,
    umbralMinimoStock: 10,
    almacen: "Los Ángeles",
    pesoKg: 12,
    anchoCm: 210,
    altoCm: 180,
    profundidadCm: 65,
}
];

console.log(
    filtrarProductosConStockBajo(productos)
);

import {
    calcularCostoEnvio,
    calcularCostoAlmacenamiento
} from "./src/utils/transformations.ts";

const laptop: Producto = {
    id: "P001",
    nombre: "Laptop Gaming",
    categoria: "Electrónica",
    precio: 2500,
    moneda: "EUR",
    disponibleEnEspana: true,
    disponibleEnEEUU: false,
    cantidadStock: 10,
    umbralMinimoStock: 5,
    almacen: "Los Ángeles",
    pesoKg: 4,
    anchoCm: 40,
    altoCm: 10,
    profundidadCm: 30
};

console.log(
    calcularCostoEnvio(
        laptop,
        "Zona C"
    )
);


console.log("hola mundo");

const costoEnvio: number =
    calcularCostoEnvio(
    laptop,
    "Zona B"
);

console.log(
`El costo de envío para ${laptop.nombre} es: ${costoEnvio}€`
);