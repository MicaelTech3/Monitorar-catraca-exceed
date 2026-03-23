import serial
import serial.tools.list_ports
import time
import threading
import logging
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db

# --- CONFIGURAÇÕES ---
FIREBASE_DB_URL = "https://exceed-contcatraca-default-rtdb.firebaseio.com"
BAUD_RATE = 9600

# --- CREDENCIAIS FIREBASE (embutidas — não precisa do .json externo) ---
FIREBASE_CREDENTIALS = {
    "type": "service_account",
    "project_id": "exceed-contcatraca",
    "private_key_id": "a078dea260d72f826602358916c7db4f03818fea",
    "private_key": (
        "-----BEGIN PRIVATE KEY-----\n"
        "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCcRQf28qQwpIJ4\n"
        "9AYsgkvbUjz7y8G+eGuJq5XWSui12kpDw9R5lKzjzr+ZbY0Jqh5mTa6vr8Vibx3e\n"
        "I0xoroWdbbpGm3bcM2+OGxCZ2wT5UKNTxCoovn1nWkxNxzXAsywfW8Cv9+mQYRve\n"
        "NLiLaefiQ+QzoYp+w/uVB8LcTJuOV6HSKfAaEmE2vnuX5FwIVvAT/zxJhmk5HQqE\n"
        "sXCLzNmQByNDBxJXEaIaQbY8qk63aYKsOlDpMi8g+pjLEFgLDQwdDWgWYEgQTypx\n"
        "TL7L663cIS33NQDhBNbTpeL0e9bihwEnJ6ryDY+O73g8yiXqtZi/DFD01rYvxORC\n"
        "woeSg3x7AgMBAAECggEADQmRVYqpeh7E0onWrgXyMDUXPhFMyQhLkyvL5MSmekLg\n"
        "/psAR2MeXXnVRbFRxU76bvc82Ll7Epr0ofYjR3napJIQABizp5a++tsf3RuHDwnU\n"
        "O9vaLJYKk6yBQIfwix18/ozCxwDm7T280SK9jBwPgDLBKjGTAr/KZdpE6T5BnXQU\n"
        "IZ750FYBKMCUondxvgrnaL4fbwOyVBIyGEpe2uqWeXfYC66M0QTw9yHqj5hLehqo\n"
        "r4XT06Ey/AmCa0t2Ovyt0xo1dQNOR1X8i0Su+4+SymQPEkp8mLZESJVtMxPoYw5l\n"
        "0GV3tEjcSFsdqPyN+ZZCuEf9hCUyABpbGYRb9Kv5CQKBgQDQTiOymdb3IgwNB0AP\n"
        "poDHrUjDPeMURlSa2wpIi16lpNObh+2+5Zv/qEw/MpQDb9YzzwODew3YzOxWBu3C\n"
        "Jm8o7xqSODRADfwfuKj4IAkEofqXctXcD5gj1tLiveOyjngAaOCT3yNVCDhhRh2b\n"
        "2NOmlQLocwi2HuxC94T7x+25BwKBgQDADNBYSIogxWEaESkya7N5RvGFZlLYunLf\n"
        "Er5fXI2J7P8tG7GASVB1ql4jpLYe9/FRekIF5+PiF7o+O9R6x0evCA2vLv7h6e8Z\n"
        "1RiY+oSk69ujOGb/1gT51ZYg4te34K/WjUZCHRxs0TAy0S0YXfCKJmn2RhcwltyR\n"
        "sWW2MaAH7QKBgH80SH5njatrIjrOg6NLBXdqbXW1FDesXzwVqOj2Gv1Cc2qWDmw1\n"
        "4Ra1WqJ5K4QRxpfqwfWHrsQHGAfMwWJ/gABaSzqhkd7P63gflye2wGsQ02uq18hD\n"
        "yZ+RL0UBusuuTr/JS+NhLz1dALj+TVR/i3g9pQH4RYiZx6N5bb8nrxb/AoGAJ8D/\n"
        "R6cMYKg652hx/KvqpMoYqKJ7t70wlhiNK7Q+4DQcxjubTJDghNrVTc+Em3h7jYAf\n"
        "NpW/yEddGBDOdPPXVNX37zFtNVp1UgWYZ+JDntfrySeduouU0Bp0Ty5ltPxfqavo\n"
        "xTq9bZEHxx0hlo+rgQ1elcoAduBjnAz6nvI6zCkCgYEAlhL5wWYR8IoNgmI3EXnm\n"
        "j1YMc//w0/0VtbrDMk9KhIWZ/x0pOG+tKgeKp/DT2yEETam6NQu7sG1lDDNriced\n"
        "2UW7XWxLWeSd9ZBtcDSDA1i78dKBpOXp554ijZZ45GhL4I8nTS54ViKJTjWFKfYj\n"
        "fsMrpas7AzEKRm5XgsvnL4U=\n"
        "-----END PRIVATE KEY-----\n"
    ),
    "client_email": "firebase-adminsdk-fbsvc@exceed-contcatraca.iam.gserviceaccount.com",
    "client_id": "108560569369219144470",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40exceed-contcatraca.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com",
}

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
log = logging.getLogger("Catraca")


def init_firebase():
    try:
        cred = credentials.Certificate(FIREBASE_CREDENTIALS)
        firebase_admin.initialize_app(cred, {"databaseURL": FIREBASE_DB_URL})
        log.info("🔥 Firebase conectado com sucesso!")
    except Exception as e:
        log.error(f"❌ Erro ao iniciar Firebase: {e}")
        exit()


def atualizar_status_site(estado, mensagem):
    """
    Atualiza o status conforme a estrutura do JS:
    /status/arduino -> { estado, mensagem, timestamp }
    """
    try:
        ref = db.reference("/status/arduino")
        ref.set({
            "estado":    estado,       # 'online', 'offline' ou 'erro'
            "mensagem":  mensagem,
            "timestamp": int(time.time() * 1000),  # milissegundos para o JS Date
        })
        log.info(f"📡 Status no Site: {estado} - {mensagem}")
    except Exception as e:
        log.error(f"❌ Erro ao atualizar status: {e}")


def registrar_no_firebase():
    try:
        agora = datetime.now()
        ref_contador = db.reference("/contador/total")
        ref_eventos  = db.reference("/eventos")

        novo_total = ref_contador.transaction(lambda v: (v or 0) + 1)

        ref_eventos.push({
            "timestamp":       agora.isoformat(),
            "data":            agora.strftime("%d/%m/%Y"),
            "hora":            agora.strftime("%H:%M:%S"),
            "hora_completa":   agora.strftime("%H:%M:%S.%f")[:-3],
            "total_acumulado": novo_total,
            "ms":              agora.microsecond // 1000,
        })
        log.info(f"✅ Passagem Registrada! Total: {novo_total}")
    except Exception as e:
        log.error(f"❌ Erro ao gravar: {e}")


def buscar_porta_arduino():
    portas = serial.tools.list_ports.comports()
    for p in portas:
        if any(x in p.description.upper() for x in ["ARDUINO", "CH340", "USB-SERIAL"]):
            return p.device
    return None


def monitorar():
    ultimo_estado = None

    while True:
        porta = buscar_porta_arduino()

        if not porta:
            if ultimo_estado != "offline":
                atualizar_status_site("offline", "Arduino desconectado ou sem energia")
                ultimo_estado = "offline"
            time.sleep(5)
            continue

        try:
            with serial.Serial(porta, BAUD_RATE, timeout=1) as ser:
                if ultimo_estado != "online":
                    atualizar_status_site("online", f"Conectado em {porta}")
                    ultimo_estado = "online"
                log.info(f"📡 Monitorando {porta}...")

                while True:
                    try:
                        linha = ser.readline().decode("utf-8", errors="ignore").strip()
                        if linha == "GIRO":
                            threading.Thread(target=registrar_no_firebase).start()
                    except (serial.SerialException, PermissionError):
                        raise Exception("Cabo removido")

        except PermissionError as e:
            if ultimo_estado != "erro":
                atualizar_status_site("erro", f"Acesso negado à porta {porta}. Feche o Arduino IDE.")
                ultimo_estado = "erro"
            log.error(f"⚠️ PermissionError: {e}")
            time.sleep(5)

        except Exception as e:
            if ultimo_estado != "offline":
                atualizar_status_site("offline", f"Conexão perdida: {str(e)}")
                ultimo_estado = "offline"
            log.error(f"⚠️ Conexão perdida: {e}")
            time.sleep(2)


if __name__ == "__main__":
    init_firebase()
    monitorar()