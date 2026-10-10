export interface GuideLink {
  label: string;
  href: string;
}

export interface GuideStep {
  id: string;
  title: string;
  minutes: string;
  summary: string;
  paragraphs: string[];
  links?: GuideLink[];
  warning?: string;
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'portfolio',
    title: 'Crea el portafolio empresarial de la clínica',
    minutes: '5 min',
    summary: 'WhatsApp Cloud API no se conecta a un WhatsApp personal. Vive dentro de un portafolio de Meta Business.',
    paragraphs: [
      'Entra a Meta Business Suite con el Facebook del responsable de la clínica y crea un portafolio empresarial. Usa el nombre legal o comercial real: Meta lo comparará con el nombre para mostrar de WhatsApp.',
      'Completa país, dirección, sitio web y un correo que sí revisen. Si la clínica ya tiene página de Facebook o Instagram, vincúlalos a este portafolio.',
    ],
    links: [{ label: 'Abrir Meta Business Suite', href: 'https://business.facebook.com/' }],
  },
  {
    id: 'verification',
    title: 'Verifica el negocio',
    minutes: 'de minutos a varios días',
    summary: 'Sin verificación el número queda en un límite bajo y el nombre para mostrar puede no aprobarse.',
    paragraphs: [
      'En Configuración del negocio → Centro de seguridad → Verificación del negocio, sube un documento oficial: acta constitutiva, comprobante fiscal o identificación del titular, según lo que pida Meta para tu país.',
      'El límite inicial suele ser de 250 clientes únicos cada 24 horas. La verificación, junto con una buena calidad de conversación, es lo que permite subir de nivel. No hace falta esperarla para sincronizar y enviar pruebas, pero sí para operar con pacientes reales a volumen.',
    ],
    links: [
      { label: 'Centro de seguridad', href: 'https://business.facebook.com/settings/security' },
    ],
    warning: 'El nombre para mostrar debe representar a la clínica. Meta rechaza nombres genéricos, solo una ciudad, o la palabra WhatsApp.',
  },
  {
    id: 'app',
    title: 'Crea una app de tipo Negocio y agrega WhatsApp',
    minutes: '5 min',
    summary: 'La app es la puerta de MediPlan hacia Graph API. No es la app de WhatsApp del teléfono.',
    paragraphs: [
      'En Meta for Developers crea una app y elige el tipo Negocio (Business). Ponle un nombre reconocible, por ejemplo «MediPlan — Clínica Sonrisa», y asóciala al portafolio del paso 1.',
      'En el panel de la app, agrega el producto WhatsApp y pulsa Configurar. Meta crea una cuenta de WhatsApp Business (WABA) de prueba y un número de prueba. Ese número de prueba solo escribe a destinatarios que tú agregues en API Setup.',
    ],
    links: [{ label: 'Crear app en Meta for Developers', href: 'https://developers.facebook.com/apps' }],
  },
  {
    id: 'number',
    title: 'Agrega y verifica el teléfono de la clínica',
    minutes: '10 min',
    summary: 'El número debe poder recibir un SMS o una llamada. No puede seguir activo en WhatsApp personal.',
    paragraphs: [
      'En la app, abre WhatsApp → API Setup (Configuración de la API) y usa «Agregar número de teléfono». También puedes hacerlo en el Administrador de WhatsApp. Elige un nombre para mostrar igual al de la clínica y una categoría de salud o belleza.',
      'Meta envía un código por SMS o llamada. Introdúcelo antes de que caduque. Si el número está en WhatsApp personal, elimina esa cuenta desde el teléfono (Ajustes → Cuenta → Eliminar cuenta), espera unos minutos y vuelve a intentar. Borrar la app no basta: hay que eliminar la cuenta.',
      'Si el número ya se usa en la app WhatsApp Business y quieres conservar chats, no lo borres. Usa en MediPlan «Conectar con Facebook» y marca la opción de coexistencia. El mismo número podrá seguir en el teléfono y, a la vez, enviar avisos por la API.',
    ],
    links: [
      { label: 'Administrador de WhatsApp', href: 'https://business.facebook.com/latest/whatsapp_manager/overview' },
      { label: 'Números de teléfono', href: 'https://business.facebook.com/latest/whatsapp_manager/phone_numbers' },
    ],
    warning:
      'No confundas el teléfono +52 55… con el Phone number ID. El ID es un identificador largo, solo dígitos, que aparece debajo del número en API Setup.',
  },
  {
    id: 'payment',
    title: 'Agrega un método de pago',
    minutes: '5 min',
    summary: 'Desde julio de 2025 Meta cobra por mensaje de plantilla, no por conversación.',
    paragraphs: [
      'En el Administrador de WhatsApp abre la facturación y agrega una tarjeta. Sin método de pago, las pruebas con el número de prueba pueden funcionar, pero los envíos a pacientes reales fallan.',
      'Las plantillas de utilidad (citas, cierres, seguimiento) y las de marketing (promociones y descuentos) tienen tarifas distintas y dependen del país del paciente. MediPlan no cobra ese tráfico: lo factura Meta a la cuenta de la clínica.',
    ],
    links: [
      { label: 'Tarifas oficiales de WhatsApp', href: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing' },
    ],
  },
  {
    id: 'token',
    title: 'Genera un token permanente de usuario del sistema',
    minutes: '8 min',
    summary: 'El token que se ve en API Setup caduca en unas 24 horas. No lo uses para la clínica.',
    paragraphs: [
      'En Configuración del negocio → Usuarios → Usuarios del sistema, crea un usuario con rol Administrador. Asígnale dos activos con control total: la app que creaste y la cuenta de WhatsApp Business.',
      'Pulsa Generar token, elige esa app, caducidad «Nunca» y marca exactamente estos permisos: whatsapp_business_messaging y whatsapp_business_management. Copia el token en ese momento: Meta no lo vuelve a mostrar.',
      'Pégalo en MediPlan. Lo trataremos como una contraseña: quien lo tenga puede enviar WhatsApp a nombre de la clínica.',
    ],
    links: [
      { label: 'Usuarios del sistema', href: 'https://business.facebook.com/settings/system-users' },
      { label: 'Guía de tokens de acceso', href: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens' },
    ],
    warning: 'Si más adelante rotas el token, vuelve a este formulario y sincroniza de nuevo. El token anterior deja de funcionar al momento.',
  },
  {
    id: 'ids',
    title: 'Copia el Phone number ID y el WABA ID',
    minutes: '2 min',
    summary: 'Son dos identificadores distintos, ambos solo dígitos, ambos en API Setup.',
    paragraphs: [
      'Abre la app → WhatsApp → API Setup. En el selector «From» elige el número de la clínica, no el de prueba, si ya lo agregaste.',
      'Phone number ID es el identificador del número. WhatsApp Business Account ID es el identificador de la cuenta (WABA). MediPlan puede enviar mensajes solo con el token y el Phone number ID, pero necesita el WABA ID para crear plantillas, leer su estado y activar webhooks.',
      'El App ID, arriba en el panel de la app, es opcional. Sirve para diagnosticar el token. El App Secret está en Configuración → Básica y solo hace falta para Embedded Signup o para firmar webhooks. No lo compartas por correo.',
    ],
    links: [{ label: 'Tus apps', href: 'https://developers.facebook.com/apps' }],
  },
  {
    id: 'sync',
    title: 'Sincroniza en este panel',
    minutes: '1 min',
    summary: 'MediPlan llama a Graph API y solo marca la clínica como conectada si Meta acepta los datos.',
    paragraphs: [
      'Pega el token permanente y el Phone number ID. Si tienes el WABA ID, pégalo también. Pulsa «Sincronizar con Meta».',
      'Verás el nombre verificado, el teléfono y la calidad que devuelve Meta. Si algo está mal, no se guarda la conexión: mostramos el error de Meta en claro, con el código y el fbtrace_id por si tienes que escribir a soporte.',
      'Después crea las plantillas recomendadas. Meta las revisa (a menudo minutos, a veces hasta 24 horas). Hasta que una plantilla figure como Aprobada, WhatsApp no deja usarla para iniciar un aviso.',
    ],
  },
  {
    id: 'templates-policy',
    title: 'Entiende qué se puede enviar',
    minutes: '3 min',
    summary: 'Las citas, cierres y seguimientos no se mandan como texto libre si el paciente no escribió en las últimas 24 horas.',
    paragraphs: [
      'Fuera de esa ventana de servicio, Cloud API solo acepta plantillas aprobadas. MediPlan crea ocho: confirmación, recordatorio, cancelación, reprogramación, cierre y seguimiento (utilidad) y promoción y descuento (marketing).',
      'Las de marketing exigen que el paciente haya aceptado recibirlas. No marques el consentimiento si no lo tienes: WhatsApp puede bajar la calidad del número o pausar la plantilla.',
      'Un texto libre de prueba solo funciona si ese paciente te escribió en las últimas 24 horas. Para comprobar el tubo, usa la plantilla hello_world del número de prueba o una plantilla ya aprobada.',
    ],
    links: [
      { label: 'Plantillas en WhatsApp Manager', href: 'https://business.facebook.com/latest/whatsapp_manager/message_templates' },
    ],
  },
  {
    id: 'webhook',
    title: 'Activa el webhook para entregas y respuestas',
    minutes: '4 min',
    summary: 'Sin webhook sabes que Meta aceptó el envío, pero no si se entregó ni si el paciente contestó.',
    paragraphs: [
      'En la pestaña Webhook de este panel copia la URL de devolución de llamada y el token de verificación. Deben ser HTTPS. Meta no acepta http://localhost.',
      'La vía corta: con la cuenta ya sincronizada, pulsa «Activar webhooks en esta cuenta». MediPlan llama a POST /{WABA_ID}/subscribed_apps con la URL de este panel. Meta verifica el token al instante.',
      'La vía manual, si prefieres el panel de Meta: app → WhatsApp → Configuration, pega la URL y el token, y suscríbete al menos a messages, message_template_status_update, account_update y phone_number_quality_update. Si usas coexistencia con la app del teléfono, suma history, smb_app_state_sync y smb_message_echoes.',
    ],
    warning: 'El dominio de esta página tiene que ser público. Si estás en una vista previa HTTPS, esa URL sirve. Si estás en tu computadora sin túnel, Meta no podrá llamar al webhook.',
  },
];

export const EMBEDDED_SIGNUP_STEPS: GuideStep[] = [
  {
    id: 'es-partner',
    title: 'Embedded Signup es el botón «Continuar con Facebook»',
    minutes: 'configuración de la app',
    summary: 'Es el flujo oficial para que la clínica no copie tokens. Exige una app de Meta preparada como proveedor.',
    paragraphs: [
      'Embedded Signup v2 y v3 dejan de funcionar el 15 de octubre de 2026. MediPlan lanza la versión 4: en Facebook Login for Business creas una configuración, eliges la variación WhatsApp Embedded Signup y marcas el producto Cloud API. Seleccionar el producto deja la configuración en v4.',
      'En Facebook Login for Business → Settings activa: Client OAuth login, Web OAuth login, Enforce HTTPS, Embedded Browser OAuth Login, Strict Mode y Login with the JavaScript SDK.',
      'Agrega el dominio exacto de este panel (el que ves arriba, con https) en Allowed domains y en Valid OAuth redirect URIs. Si falta el dominio, la ventana de Facebook termina y MediPlan no recibe el código.',
      'Copia el Configuration ID. El App ID está arriba en el panel de la app. El App Secret está en Configuración → Básica. Pégalos en «Configurar Embedded Signup» de este formulario. El secreto no se muestra de nuevo.',
      'Para clínicas que no son administradoras de tu app, la app necesita acceso avanzado (App Review) a whatsapp_business_management y whatsapp_business_messaging. Mientras pruebas, basta con que el usuario sea admin, desarrollador o tester de la app.',
    ],
    links: [
      { label: 'Implementación oficial de Embedded Signup', href: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/implementation' },
      { label: 'Versión 4', href: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/version-4' },
    ],
    warning:
      'El código que devuelve Facebook caduca en 30 segundos. No lo copies a mano: MediPlan lo canjea al momento en GET /oauth/access_token. Si la ventana se cierra antes de terminar, simplemente pulsa el botón otra vez.',
  },
];

export const COMMON_FAILURES: Array<{ title: string; detail: string }> = [
  {
    title: 'Error 190 · token caducado',
    detail: 'Pegaste el token temporal de API Setup. Genera uno de usuario del sistema sin fecha de caducidad.',
  },
  {
    title: 'Error 100 · objeto inexistente',
    detail: 'El Phone number ID está mal copiado, o el token no tiene esa cuenta asignada.',
  },
  {
    title: 'Error 131030 · destinatario no permitido',
    detail: 'El número de prueba solo escribe a la lista de API Setup. Usa el número real de la clínica para pacientes.',
  },
  {
    title: 'Error 131047 · ventana de 24 horas',
    detail: 'El texto libre solo responde a un paciente que escribió hace menos de 24 horas. Usa una plantilla.',
  },
  {
    title: 'Error 133010 · número no registrado',
    detail: 'Falta POST /{phone-number-id}/register con el PIN de 6 dígitos. El panel lo hace en «Registrar número».',
  },
  {
    title: 'Error 133005 · PIN incorrecto',
    detail: 'Ese número ya tiene verificación en dos pasos. Usa el mismo PIN. No lo intentes muchas veces seguidas.',
  },
  {
    title: 'Plantilla pendiente',
    detail: 'Crear la plantilla no alcanza. Hay que esperar el estado APPROVED. El panel lo muestra en Plantillas.',
  },
  {
    title: 'La ventana de Facebook no abre',
    detail: 'Permite ventanas emergentes. Si el panel está dentro de un iframe, ábrelo en una pestaña. El dominio debe estar en Allowed domains.',
  },
];
