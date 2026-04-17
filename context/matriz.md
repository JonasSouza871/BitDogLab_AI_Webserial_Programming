# Biblioteca de Desenhos para Matriz Neopixel 5x5

Use este contexto quando a crianca pedir desenho, emoji, simbolo, rosto, carinha ou icone na matriz 5x5.

## Regras
- Se o pedido combinar com um emoji desta lista, gere codigo MicroPython completo usando a matriz 5x5.
- Use sempre `from machine import Pin`, `import neopixel` e `import utime`.
- Use sempre `LED_MATRIX = [[24,23,22,21,20],[15,16,17,18,19],[14,13,12,11,10],[5,6,7,8,9],[4,3,2,1,0]]`.
- Use sempre `np.write()` depois de desenhar.
- Se a crianca pedir mais de um emoji, pode alternar os desenhos com `utime.sleep()`.
- Se o pedido vier com o proprio emoji, converta para a chave equivalente abaixo.
- Se o emoji nao estiver na lista, desenhe a versao mais simples possivel em 5x5.
- Para emojis conhecidos desta lista, COPIE EXATAMENTE o padrao pronto. Nao invente outro.
- NUNCA desenhe emoji conhecido com varios `if`, `elif` ou contas por linha/coluna. Use sempre uma lista de 5 strings com `"0"` e `"1"`.
- Quando o pedido incluir OLED, adicione `from machine import I2C`, `import ssd1306` e mostre o texto na tela.
- Quando o pedido incluir LED azul da BitDogLab, use o LED RGB da placa no pino azul `12`. Pode usar `Pin(12, Pin.OUT)` para ligar e desligar.
- Revise o codigo antes de responder. Nao erre imports como `rom machine`; o correto e sempre `from machine`.
- Se a crianca pedir `acende`, `mostra`, `desenha`, `faz`, `deixa` ou algo parecido sem falar tempo, entenda que a matriz e os LEDs devem ficar ligados continuamente.
- Para pedidos estaticos, NAO coloque `utime.sleep(...)` seguido de `limpar()` ou desligar no final.
- Para pedidos estaticos sem duracao, termine com:
```python
while True:
    utime.sleep(1)
```

## Codigo base recomendado
```python
from machine import Pin
import neopixel
import utime

np = neopixel.NeoPixel(Pin(7), 25)
LED_MATRIX = [[24,23,22,21,20],[15,16,17,18,19],[14,13,12,11,10],[5,6,7,8,9],[4,3,2,1,0]]

def limpar():
    for i in range(25):
        np[i] = (0, 0, 0)
    np.write()

def desenhar(padrao, cor):
    limpar()
    for linha in range(5):
        for coluna in range(5):
            if padrao[linha][coluna] == "1":
                indice = LED_MATRIX[linha][coluna]
                np[indice] = cor
    np.write()
```

## Forma obrigatoria para emoji conhecido
Use esta estrutura quando o emoji estiver na lista:

```python
padrao = [
    "00000",
    "01010",
    "00000",
    "10001",
    "01110",
]

desenhar(padrao, (255, 255, 0))
```

Nao substitua esse formato por varios `if/elif`.

## Emojis e padroes prontos

### coracao / ❤️ / ❤ / heart / love
Cor sugerida: `(80, 0, 0)`
```python
[
    "01010",
    "11111",
    "11111",
    "01110",
    "00100",
]
```

### estrela / ⭐ / star
Cor sugerida: `(80, 70, 0)`
```python
[
    "00100",
    "11111",
    "01110",
    "11111",
    "00100",
]
```

### feliz / sorriso / carinha feliz / 😀 / 🙂
Cor sugerida: `(80, 80, 0)`
```python
[
    "00000",
    "01010",
    "00000",
    "10001",
    "01110",
]
```

### triste / carinha triste / 😢 / 🙁
Cor sugerida: `(0, 0, 80)`
```python
[
    "00000",
    "01010",
    "00000",
    "01110",
    "10001",
]
```

### casa / casinha / 🏠 / home
Cor sugerida: `(0, 60, 20)`
```python
[
    "00100",
    "01110",
    "11111",
    "10101",
    "11111",
]
```

### flor / 🌸 / flower
Cor sugerida: `(80, 20, 50)`
```python
[
    "00100",
    "10101",
    "01110",
    "10101",
    "00100",
]
```

### sol / ☀️ / sun
Cor sugerida: `(80, 40, 0)`
```python
[
    "10101",
    "01110",
    "11111",
    "01110",
    "10101",
]
```

### lua / 🌙 / moon
Cor sugerida: `(30, 30, 80)`
```python
[
    "00111",
    "01110",
    "01100",
    "01110",
    "00111",
]
```

### seta_direita / seta para direita / ➡️ / right
Cor sugerida: `(0, 70, 0)`
```python
[
    "00100",
    "00011",
    "11111",
    "00011",
    "00100",
]
```

### seta_esquerda / seta para esquerda / ⬅️ / left
Cor sugerida: `(0, 70, 0)`
```python
[
    "00100",
    "11000",
    "11111",
    "11000",
    "00100",
]
```

### check / certo / correto / ✅
Cor sugerida: `(0, 80, 0)`
```python
[
    "00001",
    "00010",
    "10100",
    "01000",
    "00000",
]
```

### x / xis / errado / ❌
Cor sugerida: `(80, 0, 0)`
```python
[
    "10001",
    "01010",
    "00100",
    "01010",
    "10001",
]
```

### fantasma / 👻 / ghost
Cor sugerida: `(70, 70, 70)`
```python
[
    "01110",
    "11111",
    "11111",
    "10101",
    "10101",
]
```

### gato / gatinho / 😺 / cat
Cor sugerida: `(80, 40, 0)`
```python
[
    "10001",
    "11111",
    "11111",
    "01110",
    "01010",
]
```

### cachorro / cachorrinho / 🐶 / dog
Cor sugerida: `(60, 40, 20)`
```python
[
    "10001",
    "11011",
    "11111",
    "01110",
    "01010",
]
```

## Exemplo completo pronto

### Carinha feliz amarela na matriz + "ESTOU FELIZ!" no OLED + azul ligado
Copie este estilo quando o pedido for parecido:

```python
from machine import Pin, I2C
import neopixel
import utime
import ssd1306

np = neopixel.NeoPixel(Pin(7), 25)
LED_MATRIX = [[24,23,22,21,20],[15,16,17,18,19],[14,13,12,11,10],[5,6,7,8,9],[4,3,2,1,0]]

i2c = I2C(1, scl=Pin(3), sda=Pin(2), freq=400000)
d = ssd1306.SSD1306_I2C(128, 64, i2c)

led_azul = Pin(12, Pin.OUT)

def limpar():
    for i in range(25):
        np[i] = (0, 0, 0)
    np.write()

def desenhar(padrao, cor):
    limpar()
    for linha in range(5):
        for coluna in range(5):
            if padrao[linha][coluna] == "1":
                indice = LED_MATRIX[linha][coluna]
                np[indice] = cor
    np.write()

carinha_feliz = [
    "00000",
    "01010",
    "00000",
    "10001",
    "01110",
]

led_azul.value(1)
d.fill(0)
d.text("ESTOU FELIZ!", 0, 0)
d.show()
desenhar(carinha_feliz, (255, 255, 0))

while True:
    utime.sleep(1)
```

## Como responder
- Responda apenas com codigo MicroPython completo.
- Se o pedido for um unico emoji, mostre o desenho parado.
- Se o pedido falar em animacao ou varios emojis, crie um loop simples alternando os padroes.
- Prefira nomes de variaveis simples, para criancas entenderem.
- Para emoji conhecido, prefira sempre criar a variavel `padrao` ou `carinha_feliz` e chamar `desenhar(...)`.
- Se o pedido for estatico, deixe o resultado ligado para sempre, sem limpar no final.
