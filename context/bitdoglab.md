# Banco de Informacoes de Hardware (BIH) da BitDogLab V7

Apos ler esta mensagem, por favor, pergunte ao usuario: O que posso lhe ajudar na programacao da sua BitDogLab V7?

A BitDogLab, uma iniciativa do Projeto Escola 4.0 da Unicamp, e uma ferramenta educacional dedicada a eletronica e computacao. Baseada na Raspberry Pi Pico H ou W, permite aos usuarios explorar, montar e programar utilizando componentes montados na sua placa e tambem externos conectados de forma organizada e segura. Selecionados meticulosamente, os componentes promovem um aprendizado mao na massa, incentivando os usuarios a aprimorar habilidades de programacao e eletronica de maneira sinergica e progressiva.

Um diferencial da BitDogLab e que seu projeto e totalmente aberto, permitindo que seja livremente copiada, fabricada, montada e melhorada pelos usuarios. Mais informacoes em: https://github.com/Fruett/BitDogLab

## Conexoes e Configuracoes de Hardware

Na placa da BitDogLab, as conexoes da Raspberry Pi Pico com outros componentes estao realizadas da seguinte forma:

### LED RGB

Um LED RGB, catodo comum:
- **Vermelho:** GPIO 13 (resistor 220 ohm)
- **Verde:** GPIO 11 (resistor 220 ohm)
- **Azul:** GPIO 12 (resistor 150 ohm)

### Botoes

Ha 3 botoes coloridos, todos com pull-up interno (estado padrao HIGH, pressionado LOW):
- **Botao A:** GPIO 10 (outro terminal no GND)
- **Botao B:** GPIO 5 (outro terminal no GND)
- **Botao C:** GPIO 6 (outro terminal no GND)

### Buzzer

Um buzzer passivo (Buzzer A) conectado via transistor ao **GPIO 21**.

### Matriz de LEDs (Neopixel)

Matriz de LEDs 5050 RGB 5x5 tipo WS2812B (Neopixel) conectada ao **GPIO 7**.
No final da sequencia de 25 LEDs ha um conector com acesso ao pino de dados (Dout, 5V e GND).
Para conectar mais LEDs, localizar o jumper "Ext. RGB Neopixel" no verso da placa.

Mapeamento da matriz:

```python
LED_MATRIX = [
    [24, 23, 22, 21, 20],
    [15, 16, 17, 18, 19],
    [14, 13, 12, 11, 10],
    [5,  6,  7,  8,  9],
    [4,  3,  2,  1,  0]
]
```

### Joystick

Joystick analogico tipo KY023:
- **VRy:** GPIO 26
- **VRx:** GPIO 27
- **Botao SW:** GPIO 22 (outro terminal no GND, configurar pull-up interno)

### Display OLED

A versao 7 suporta duas opcoes de display:

**Opcao 1 - SSD1306 (0.96"):**
- 128x64 pixels
- Controlador ssd1306
- Comunicacao I2C
- Endereco 0x3C
- Requer biblioteca `ssd1306.py`

**Opcao 2 - SH1107 (maior):**
- 128x128 pixels
- Controlador sh1107
- Comunicacao I2C
- Endereco 0x3C
- Requer biblioteca `sh1107.py`

Ambos conectados em **GPIO 2 (SDA)** e **GPIO 3 (SCL)**, canal I2C1.

Correcao de orientacao para SH1107:

```python
from machine import Pin, I2C
import sh1107
i2c = I2C(1, scl=Pin(3), sda=Pin(2))
display = sh1107.SH1107_I2C(128, 128, i2c, address=0x3C)
display.write_cmd(0xA0)  # SEGREMAP corrige flip horizontal
display.write_cmd(0xC0)  # COMSCAN corrige rotacao vertical
```

### Microfone

Modulo microfone de eletreto com saida analogica no **GPIO 28**.
- Nivel medio: 1,65V
- Faixa: 0V a 3,3V

### Conector IDC (Expansao)

Conector IDC box de 14 pinos para expansao de hardware:

| Pino | Conexao |
|------|---------|
| 1 | GND |
| 2 | 5V |
| 3 | 3V3 |
| 4 | GPIO 8 |
| 5 | GPIO 28 |
| 6 | GPIO 9 |
| 7 | GND analogico |
| 8 | GPIO 4 |
| 9 | GPIO 17 |
| 10 | GND |
| 11 | GPIO 16 |
| 12 | GPIO 19 |
| 13 | GND |
| 14 | GPIO 18 |

Para SPI: GPIO 16 (RX), GPIO 17 (CSn), GPIO 18 (SCK), GPIO 19 (TX).

### Barra de Terminais (Garras Jacare)

- DIG 0, 1, 2, 3 -> GPIO 0, 1, 2, 3
- GND analogico, GPIO 28, GND, 3V3, 5V

### Conectores I2C

**I2C 0 (lado direito, extremidade superior):**
- GPIO 0 (SDA), GPIO 1 (SCL), 3V3, GND
- Tambem pode ser usado para UART (TX/RX), ex: modulo GPS

**I2C 1 (lado esquerdo):**
- GPIO 2 (SDA), GPIO 3 (SCL), 3V3, GND

## Orientacoes para MicroPython

### Imports recomendados

```python
from machine import PWM, Pin, SoftI2C, ADC
import neopixel
import utime
import random
import math
```

### Configuracao do OLED (SSD1306)

```python
from ssd1306 import SSD1306_I2C
i2c = SoftI2C(scl=Pin(15), sda=Pin(14))
oled = SSD1306_I2C(128, 64, i2c)
```

### Configuracao da Matriz Neopixel

```python
NUM_LEDS = 25
np = neopixel.NeoPixel(Pin(7), NUM_LEDS)
```

### Notas

- Geracao de sinais PWM: o tipo `u16` (inteiro 16 bits sem sinal) e usado para valores de frequencia do PWM na Raspberry Pi Pico.
- Prefira a biblioteca `utime` ao inves da `time`.
