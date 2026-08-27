import time

pattern = [
    "🧶 🧵 🧶 🧵 🧶 🧵 🧶 🧵 🧶 🧵",
    "🧵 🧶 🧵 🧶 🧵 🧶 🧵 🧶 🧵 🧶",
    "🧶 🧵 🧶 🧵 🧶 🧵 🧶 🧵 🧶 🧵",
    "🧵 🧶 🧵 🧶 🧵 🧶 🧵 🧶 🧵 🧶"
]

print("🧶 Matolarni to'qish boshlanmoqda...\n")

for i in range(3):
    for line in pattern:
        print(line)
        time.sleep(0.2)

print("\n✅ To'quv tayyor bo'ldi!")
