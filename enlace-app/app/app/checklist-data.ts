import type { ChecklistItem } from '@/lib/types'

/* Checklist de boda adaptada a España (trámites civiles y religiosos, costumbres y plazos habituales).
   Si se cambia la lista, subir CHECKLIST_VERSION: las bodas guardadas se actualizan conservando lo marcado. */

export const CHECKLIST_VERSION = 2

type Tarea = Omit<ChecklistItem, 'id' | 'done'>
const t = (g: string, c: string, n: string, p: Tarea['p'], nota: string): Tarea => ({ g, c, n, p, nota })

export const DEFAULT_CHECKLIST: Tarea[] = [
  // 12-18 meses antes
  t('12-18 meses antes', '18 meses antes', 'Fijar la fecha de la boda', 'urgente', 'Mirad puentes, festivos y otras bodas de la familia'),
  t('12-18 meses antes', '18 meses antes', 'Decidir el presupuesto total', 'urgente', 'Contad alianzas, vestido, traje y viaje de novios'),
  t('12-18 meses antes', '17 meses antes', 'Hacer la primera lista de invitados', 'urgente', 'Repartid cupos entre las dos familias'),
  t('12-18 meses antes', '16 meses antes', 'Decidir el tipo de ceremonia: civil, religiosa o simbólica', 'urgente', 'Cambia los papeles que necesitáis y sus plazos'),
  t('12-18 meses antes', '15 meses antes', 'Visitar fincas y reservar la vuestra', 'urgente', 'Pedid el contrato y las condiciones de cancelación y de pago'),
  t('12-18 meses antes', '15 meses antes', 'Reservar la iglesia o el lugar de la ceremonia', 'urgente', 'Parroquias y ayuntamientos se llenan pronto en primavera y otoño'),
  t('12-18 meses antes', '14 meses antes', 'Contratar fotógrafo y vídeo', 'urgente', 'Los buenos se reservan con más de un año'),
  t('12-18 meses antes', '14 meses antes', 'Reservar el catering si la finca no lo incluye', 'pronto', 'Pedid al menos tres presupuestos'),

  // 9-12 meses antes
  t('9-12 meses antes', '12 meses antes', 'Elegir padrino y madrina', 'pronto', 'Lo tradicional es la madre del novio y el padre de la novia, pero vale cualquiera'),
  t('9-12 meses antes', '12 meses antes', 'Elegir a los dos testigos', 'pronto', 'Mayores de edad. Si os casáis por lo civil, los necesitáis para el expediente y para firmar el día de la boda'),
  t('9-12 meses antes', '12 meses antes', 'Empezar a buscar el vestido de novia', 'urgente', 'La confección suele tardar de 6 a 9 meses'),
  t('9-12 meses antes', '11 meses antes', 'Contratar la música: DJ, banda o coro para la ceremonia', 'pronto', 'Preguntad por el limitador de sonido de la finca'),
  t('9-12 meses antes', '11 meses antes', 'Reservar el viaje de novios', 'pronto', 'Contad con los 15 días de permiso por matrimonio'),
  t('9-12 meses antes', '10 meses antes', 'Avisar de la fecha a los invitados (save the date)', 'normal', 'Sobre todo a quien viene de fuera'),
  t('9-12 meses antes', '10 meses antes', 'Definir el estilo y los colores de la boda', 'normal', 'Ayuda con flores, papelería y decoración'),
  t('9-12 meses antes', '9 meses antes', 'Reservar autobús para los invitados', 'pronto', 'Casi imprescindible si la finca está a las afueras'),

  // 6-9 meses antes
  t('6-9 meses antes', '8 meses antes', 'Boda civil: iniciar el expediente matrimonial', 'urgente', 'En el Registro Civil de vuestro domicilio o ante notario. DNI, certificado literal de nacimiento, empadronamiento y dos testigos. La autorización vale un año, así que no lo empecéis antes de tiempo'),
  t('6-9 meses antes', '8 meses antes', 'Boda religiosa: abrir el expediente en la parroquia', 'urgente', 'Partida de bautismo de cada uno, expedida hace menos de 6 meses'),
  t('6-9 meses antes', '7 meses antes', 'Boda religiosa: apuntaros al cursillo prematrimonial', 'pronto', 'Las plazas se agotan; consultad fechas en vuestra parroquia'),
  t('6-9 meses antes', '7 meses antes', 'Si la ceremonia civil es en la finca, confirmar quién la oficia', 'pronto', 'Para que tenga validez legal: notario o concejal. Si no, firmad en el juzgado y haced en la finca una ceremonia simbólica'),
  t('6-9 meses antes', '7 meses antes', 'Buscar el traje del novio', 'pronto', 'A medida tarda varios meses'),
  t('6-9 meses antes', '7 meses antes', 'Reservar maquillaje y peluquería', 'pronto', 'Preguntad si se desplazan a casa o a la finca'),
  t('6-9 meses antes', '6 meses antes', 'Elegir floristería: ramo, prendidos y decoración', 'pronto', 'Prendidos para el novio, el padrino y los testigos'),
  t('6-9 meses antes', '6 meses antes', 'Buscar alojamiento para los invitados de fuera', 'normal', 'Pedid precio de grupo en algún hotel cercano'),
  t('6-9 meses antes', '6 meses antes', 'Reservar el coche nupcial, si lo vais a llevar', 'normal', 'Confirmad todo el trayecto y las esperas'),

  // 4-6 meses antes
  t('4-6 meses antes', '5 meses antes', 'Encargar las invitaciones', 'pronto', 'Impresas, digitales o las dos'),
  t('4-6 meses antes', '5 meses antes', 'Prueba de menú con la finca o el catering', 'urgente', 'Id los dos y decidid vinos, tarta y recena'),
  t('4-6 meses antes', '5 meses antes', 'Elegir las alianzas y encargar el grabado', 'pronto', 'El grabado suele tardar unas semanas'),
  t('4-6 meses antes', '5 meses antes', 'Conseguir las arras', 'normal', 'Trece monedas; muchas familias las heredan'),
  t('4-6 meses antes', '4 meses antes', 'Decidir número de cuenta o lista de bodas', 'normal', 'Lo más habitual en España es incluir el número de cuenta con la invitación'),
  t('4-6 meses antes', '4 meses antes', 'Comprar zapatos y complementos', 'pronto', 'Llevadlos a la primera prueba del vestido'),
  t('4-6 meses antes', '4 meses antes', 'Primera prueba del vestido', 'urgente', 'Con los zapatos definitivos'),
  t('4-6 meses antes', '4 meses antes', 'Elegir las lecturas y quién las hará', 'normal', 'Familiares o amigos cercanos'),

  // 2-3 meses antes
  t('2-3 meses antes', '3 meses antes', 'Enviar las invitaciones', 'urgente', 'Con una fecha límite para confirmar asistencia'),
  t('2-3 meses antes', '3 meses antes', 'Avisar en el trabajo y pedir los 15 días de permiso por matrimonio', 'pronto', 'Son días naturales y retribuidos; mirad vuestro convenio por si os da alguno más'),
  t('2-3 meses antes', '3 meses antes', 'Encargar los detalles para los invitados', 'pronto', 'Abanicos en verano, alpargatas para el baile, algo personal…'),
  t('2-3 meses antes', '2 meses antes', 'Prueba de peinado y maquillaje', 'pronto', 'Llevad fotos de lo que os gusta'),
  t('2-3 meses antes', '2 meses antes', 'Revisar pasaportes, visados y vacunas del viaje', 'pronto', 'Algunos destinos piden pasaporte con 6 meses de validez'),
  t('2-3 meses antes', '2 meses antes', 'Cerrar barra libre, recena y hora de fin de fiesta', 'pronto', 'Y las horas extra, si las vais a querer'),
  t('2-3 meses antes', '2 meses antes', 'Organizar las despedidas de soltero', 'normal', 'Mejor que no caigan la semana de la boda'),
  t('2-3 meses antes', '2 meses antes', 'Contratar animación para los niños', 'normal', 'Si va a haber muchos peques'),
  t('2-3 meses antes', '2 meses antes', 'Elegir la música de la ceremonia, la entrada y el primer baile', 'normal', 'Pasad la lista al DJ y al coro'),

  // El último mes
  t('El último mes', '4 semanas antes', 'Confirmar el número final de invitados', 'urgente', 'La finca suele pedirlo con 2 o 3 semanas de antelación'),
  t('El último mes', '3 semanas antes', 'Hacer el seating y las tarjetas de mesa', 'urgente', 'Y pasar las alergias e intolerancias al catering'),
  t('El último mes', '3 semanas antes', 'Reunión final con la finca y el catering', 'urgente', 'Horarios, plano, menús especiales y forma de pago'),
  t('El último mes', '3 semanas antes', 'Segunda prueba del vestido', 'urgente', 'Con todos los complementos'),
  t('El último mes', '2 semanas antes', 'Pasar al fotógrafo las fotos imprescindibles', 'pronto', 'Familias, amigos y momentos que no os queréis perder'),
  t('El último mes', '2 semanas antes', 'Preparar los pagos pendientes a proveedores', 'urgente', 'Muchas fincas cobran el resto la semana antes'),
  t('El último mes', '2 semanas antes', 'Confirmar horarios con todos los proveedores', 'urgente', 'Una llamada a cada uno'),
  t('El último mes', '2 semanas antes', 'Cerrar el cronograma del día y compartirlo', 'urgente', 'Con proveedores, padrinos y quien coordine'),
  t('El último mes', '2 semanas antes', 'Preparar los detalles para padrinos y familia', 'normal', 'Ramos para las madres, un recuerdo para los padrinos…'),

  // La semana de la boda
  t('La semana de la boda', '3 días antes', 'Recoger el vestido y el traje', 'urgente', 'Colgadlos en un sitio fresco y sin luz directa'),
  t('La semana de la boda', '2 días antes', 'Dejar las alianzas y las arras con quien las lleva', 'urgente', 'Normalmente el padrino o los niños de arras'),
  t('La semana de la boda', '2 días antes', 'Llevar a la finca los detalles, las tarjetas de mesa y vuestra decoración', 'pronto', 'Dejadlo todo etiquetado'),
  t('La semana de la boda', '2 días antes', 'Manicura y tratamientos de belleza', 'normal', 'Nada nuevo para la piel a última hora'),
  t('La semana de la boda', '1 día antes', 'Preparar la maleta del viaje de novios', 'normal', 'Documentación, reservas y cargadores'),

  // El día de la boda
  t('El día de la boda', 'El día', 'Kit de emergencia', 'urgente', 'Imperdibles, aguja e hilo, analgésicos, quitamanchas'),
  t('El día de la boda', 'El día', 'Que alguien de confianza hable con los proveedores', 'urgente', 'Así vosotros no tenéis que coger el móvil'),
  t('El día de la boda', 'El día', 'Decidir a quién regaláis el ramo', 'normal', 'En muchas bodas se dedica a alguien especial en lugar de lanzarlo'),

  // Después de la boda
  t('Después de la boda', '1-2 semanas después', 'Pedir el certificado de matrimonio', 'pronto', 'Lo necesitaréis para el trabajo, el banco o la Seguridad Social'),
  t('Después de la boda', '1-2 semanas después', 'Entregar en el trabajo el justificante del permiso', 'pronto', 'Vale el certificado de matrimonio'),
  t('Después de la boda', '1-2 semanas después', 'Agradecer los regalos y la ayuda', 'pronto', 'Un mensaje personal o un vídeo de agradecimiento'),
  t('Después de la boda', '1-2 semanas después', 'Devolver lo alquilado', 'pronto', 'Trajes, decoración, menaje…'),
  t('Después de la boda', 'Cuando os mudéis', 'Actualizar el empadronamiento si cambiáis de casa', 'normal', 'En vuestro ayuntamiento'),
  t('Después de la boda', 'En la próxima renta', 'Comparar declaración conjunta e individual', 'normal', 'Elegid la que os salga mejor'),
  t('Después de la boda', '1-3 meses después', 'Recibir las fotos y el vídeo y hacer copia de seguridad', 'normal', 'Guardadlas en dos sitios distintos'),
  t('Después de la boda', '1-3 meses después', 'Elegir el álbum', 'normal', 'Con calma, que es para toda la vida'),
]

/** Actualiza una checklist guardada a la versión actual conservando las tareas ya marcadas */
export function actualizarChecklist(anterior: ChecklistItem[]): ChecklistItem[] {
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
  const hechas = new Set(anterior.filter(c => c.done).map(c => norm(c.n)))
  return DEFAULT_CHECKLIST.map((c, i) => ({ ...c, id: 1000 + i, done: hechas.has(norm(c.n)) }))
}

export const TOTAL_TAREAS = DEFAULT_CHECKLIST.length
