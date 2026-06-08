
export type ZonaEnvio =
    | "Zona A"
    | "Zona B"
    | "Zona C";

    export type CategoriaProducto =
    | "Electrónica"
    | "Alimentos"
    | "Ropa"
    | "Muebles";

export type UbicacionAlmacen =
    | "Los Ángeles"
    | "Zaragoza";

export type EstadoEnvio =
    | "Pendiente"
    | "En Tránsito"
    | "Entregado"
    | "Cancelado";

export interface Producto {
    id: string;
    nombre: string;
    categoria: CategoriaProducto;
    precio: number;
    cantidadStock: number;
    umbralMinimoStock: number;
    almacen: UbicacionAlmacen;
    pesoKg: number;
    anchoCm: number;
    altoCm: number;
    profundidadCm: number;
}

export interface Transportista {
    id: string;
    nombre: string;
    porcentajeEntregasATiempo: number;
    enviosActivos: number;
}

export interface Envio {
    id: string;
    idProducto: string;
    idTransportista: string;
    cantidad: number;
    estado: EstadoEnvio;
    destino: string;
}








