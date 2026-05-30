export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "superadmin" | "admin" | "recolector";
export type OrganizacionTipo = "generador" | "empresa" | "cooperativa";
export type RecoleccionEstado =
  | "borrador"
  | "solicitada"
  | "asignada"
  | "en_camino"
  | "recolectada"
  | "en_planta"
  | "transformada"
  | "cancelada";

export type RutaEstado =
  | "borrador"
  | "activa"
  | "en_curso"
  | "completada"
  | "cancelada";

export type RutaTurno = "manana" | "tarde";

export type RecoleccionOperativaEstado =
  | "pendiente"
  | "en_camino"
  | "visitada"
  | "omitida"
  | "cancelada";

export type ParadaEstado = RecoleccionOperativaEstado;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          full_name: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: UserRole;
          full_name?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          full_name?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizaciones: {
        Row: {
          id: string;
          tipo: OrganizacionTipo;
          nombre: string;
          contacto_email: string | null;
          contacto_telefono: string | null;
          direccion: string | null;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tipo: OrganizacionTipo;
          nombre: string;
          contacto_email?: string | null;
          contacto_telefono?: string | null;
          direccion?: string | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tipo?: OrganizacionTipo;
          nombre?: string;
          contacto_email?: string | null;
          contacto_telefono?: string | null;
          direccion?: string | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recolecciones: {
        Row: {
          id: string;
          estado: RecoleccionEstado;
          organizacion_id: string;
          cooperativa_id: string | null;
          asignado_a: string | null;
          direccion: string;
          programada_para: string | null;
          notas: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          estado?: RecoleccionEstado;
          organizacion_id: string;
          cooperativa_id?: string | null;
          asignado_a?: string | null;
          direccion: string;
          programada_para?: string | null;
          notas?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          estado?: RecoleccionEstado;
          organizacion_id?: string;
          cooperativa_id?: string | null;
          asignado_a?: string | null;
          direccion?: string;
          programada_para?: string | null;
          notas?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rutas: {
        Row: {
          id: string;
          nombre: string;
          fecha: string;
          turno: RutaTurno | null;
          estado: RutaEstado;
          asignado_a: string | null;
          spreadsheet_id: string | null;
          spreadsheet_url: string | null;
          sheet_name: string | null;
          external_key: string | null;
          imported_at: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          fecha: string;
          turno?: RutaTurno | null;
          estado?: RutaEstado;
          asignado_a?: string | null;
          spreadsheet_id?: string | null;
          spreadsheet_url?: string | null;
          sheet_name?: string | null;
          external_key?: string | null;
          imported_at?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          fecha?: string;
          turno?: RutaTurno | null;
          estado?: RutaEstado;
          asignado_a?: string | null;
          spreadsheet_id?: string | null;
          spreadsheet_url?: string | null;
          sheet_name?: string | null;
          external_key?: string | null;
          imported_at?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ruta_paradas: {
        Row: {
          id: string;
          ruta_id: string;
          orden: number;
          direccion: string;
          generador_nombre: string | null;
          contacto_telefono: string | null;
          notas: string | null;
          estado: ParadaEstado;
          recoleccion_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ruta_id: string;
          orden: number;
          direccion: string;
          generador_nombre?: string | null;
          contacto_telefono?: string | null;
          notas?: string | null;
          estado?: ParadaEstado;
          recoleccion_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ruta_id?: string;
          orden?: number;
          direccion?: string;
          generador_nombre?: string | null;
          contacto_telefono?: string | null;
          notas?: string | null;
          estado?: ParadaEstado;
          recoleccion_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ruta_recolecciones: {
        Row: {
          id: string;
          ruta_id: string;
          orden: number;
          zona: string | null;
          nombre: string;
          unidad: string | null;
          tipo_servicio: string | null;
          frecuencia: string | null;
          barrio: string | null;
          direccion: string;
          depto: string | null;
          telefono: string | null;
          telefono_normalizado: string;
          observaciones: string | null;
          dia: string;
          hora: string;
          nota_encargado: string | null;
          precio: string | null;
          deuda: string | null;
          latitud: number | null;
          longitud: number | null;
          coordenadas_dms: string | null;
          direccion_google: string | null;
          estado_operativo: RecoleccionOperativaEstado;
          sheet_fila: number | null;
          sheet_estado: string | null;
          sheet_mensaje: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ruta_id: string;
          orden: number;
          zona?: string | null;
          nombre: string;
          unidad?: string | null;
          tipo_servicio?: string | null;
          frecuencia?: string | null;
          barrio?: string | null;
          direccion: string;
          depto?: string | null;
          telefono?: string | null;
          telefono_normalizado: string;
          observaciones?: string | null;
          dia: string;
          hora: string;
          nota_encargado?: string | null;
          precio?: string | null;
          deuda?: string | null;
          latitud?: number | null;
          longitud?: number | null;
          coordenadas_dms?: string | null;
          direccion_google?: string | null;
          estado_operativo?: RecoleccionOperativaEstado;
          sheet_fila?: number | null;
          sheet_estado?: string | null;
          sheet_mensaje?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ruta_id?: string;
          orden?: number;
          zona?: string | null;
          nombre?: string;
          unidad?: string | null;
          tipo_servicio?: string | null;
          frecuencia?: string | null;
          barrio?: string | null;
          direccion?: string;
          depto?: string | null;
          telefono?: string | null;
          telefono_normalizado?: string;
          observaciones?: string | null;
          dia?: string;
          hora?: string;
          nota_encargado?: string | null;
          precio?: string | null;
          deuda?: string | null;
          latitud?: number | null;
          longitud?: number | null;
          coordenadas_dms?: string | null;
          direccion_google?: string | null;
          estado_operativo?: RecoleccionOperativaEstado;
          sheet_fila?: number | null;
          sheet_estado?: string | null;
          sheet_mensaje?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_superadmin: { Args: Record<string, never>; Returns: boolean };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      current_user_role: { Args: Record<string, never>; Returns: UserRole };
    };
    Enums: {
      user_role: UserRole;
      organizacion_tipo: OrganizacionTipo;
      recoleccion_estado: RecoleccionEstado;
      ruta_estado: RutaEstado;
      ruta_turno: RutaTurno;
      parada_estado: ParadaEstado;
      recoleccion_operativa_estado: RecoleccionOperativaEstado;
    };
    CompositeTypes: Record<string, never>;
  };
};
