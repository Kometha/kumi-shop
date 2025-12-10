export interface Pedido {
    cliente:      string;
    codigopedido: string;
    canal:        string;
    fecha:        Date;
    total:        number;
    estado:       string;
    item:         Item;
}

export interface Item {
    id:                            number;
    codigoPedido:                  number;
    clienteID:                     null;
    canalID:                       number;
    estadoID:                      number;
    fechaPedido:                   Date;
    total:                         number;
    notas:                         null | string;
    createdAt:                     Date;
    updatedAt:                     Date;
    nombreCliente:                 string;
    telefonoCliente:               string;
    subtotalProductos:             number;
    totalComisionesFinanciamiento: number;
    totalFactura:                  number;
    totalComisionesMetodos:        number;
    montoNetoRecibido:             number;
    costoEnvio:                    number;
    necesitaEnvio:                 boolean;
    direccionCliente:              null | string;
}
