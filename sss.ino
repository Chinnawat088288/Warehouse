#include <WiFi.h>
#include <PubSubClient.h>
#include <esp_wpa2.h> // สำหรับ WPA2 Enterprise

// ====== กำหนด WiFi และ MQTT ======
const char* ssid = "DigitalTechGroup";
const char* username = "sac";
const char* identity = "sac";
const char* password = "UJJthG^2";

const char* mqtt_server = "10.1.65.30";
const int mqtt_port = 1883;
const char* mqtt_topic = "floor15/access-control/04";


#define RELAY_PIN 23

WiFiClient espClient; // ใช้ WiFiClient สำหรับ MQTT ไม่เข้ารหัส
PubSubClient client(espClient);

// ฟังก์ชัน callback เมื่อมีข้อความ MQTT เข้ามา
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  message.trim();
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  // ควบคุมรีเลย์ด้วยข้อความ "ON" หรือ "OFF"
  if (message.equalsIgnoreCase("ON")) {
    digitalWrite(RELAY_PIN, HIGH);
    Serial.println("Relay ON");
  } else if (message.equalsIgnoreCase("OFF")) {
    digitalWrite(RELAY_PIN, LOW);
    Serial.println("Relay OFF");
  } else {
    Serial.println("Unknown command");
  }
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.disconnect(true); // ล้าง config เดิม
  WiFi.mode(WIFI_STA);

  // ตั้งค่า WPA2 Enterprise
  esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)identity, strlen(identity));
  esp_wifi_sta_wpa2_ent_set_username((uint8_t *)username, strlen(username));
  esp_wifi_sta_wpa2_ent_set_password((uint8_t *)password, strlen(password));
  esp_wifi_sta_wpa2_ent_enable();

  WiFi.begin(ssid);

  int retry = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    retry++;
    if (retry > 60) { // รอประมาณ 30 วินาที
      Serial.println("\nWiFi connect timeout!");
      return;
    }
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP32Client")) {
      Serial.println("connected");
      client.subscribe(mqtt_topic);
      Serial.print("Subscribed to topic: ");
      Serial.println(mqtt_topic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // ปิดรีเลย์เริ่มต้น

  Serial.println("Booting...");
  setup_wifi();

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  Serial.println("Setup complete. Waiting for MQTT messages...");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}
