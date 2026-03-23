/*
  Teste de Bancada - Contador de Catraca
  Simulação: Encoste um fio no pino D2 e no GND para contar.
*/

const int PINO_SENSOR   = 2;
const int PINO_LED      = 13;   // LED interno do Arduino
const int DEBOUNCE_MS   = 300;  // Tempo de espera para evitar contagem dupla

bool estado_anterior    = HIGH;
unsigned long ultimo_giro = 0;

void setup() {
  Serial.begin(9600);
  pinMode(PINO_SENSOR, INPUT_PULLUP); // Usa resistor interno (fio solto = HIGH)
  pinMode(PINO_LED, OUTPUT);
  digitalWrite(PINO_LED, LOW);
  
  delay(1000);
  Serial.println("PRONTO"); // Sinaliza para o Python que o Arduino ligou
}

void loop() {
  bool estado_atual = digitalRead(PINO_SENSOR);
  unsigned long agora = millis();

  // Detecta quando o fio encosta no GND (HIGH -> LOW)
  if (estado_anterior == HIGH && estado_atual == LOW) {
    if (agora - ultimo_giro > DEBOUNCE_MS) {
      ultimo_giro = agora;
      
      // Feedback Visual
      digitalWrite(PINO_LED, HIGH);
      
      // Envia comando para o PC
      Serial.println("GIRO");
      
      delay(100); // Pisca curto
      digitalWrite(PINO_LED, LOW);
    }
  }

  estado_anterior = estado_atual;
}