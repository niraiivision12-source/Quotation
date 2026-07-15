export interface DummyProduct {
  sku: string;
  name: string;
  brand: string;
  category: string;
  costPrice: number;
  mrp: number;
  stockQty: number;
  unit: string;
  description: string;
  tax: number;
  aliases: string[];
}

// 10 categories, each with 20 items = 200 unique products
const rawCategoryTemplates: Record<
  string,
  {
    abbr: string;
    brands: string[];
    items: Array<{
      name: string;
      code: string;
      unit: string;
      basePrice: number;
      aliases: string[];
    }>;
  }
> = {
  "Electronics": {
    abbr: "ELE",
    brands: ["Sony", "LG", "Samsung", "Panasonic", "JBL", "Bose"],
    items: [
      { name: "Smart LED TV", code: "TV", unit: "piece", basePrice: 32000, aliases: ["television", "smart tv", "4k tv", "led screen"] },
      { name: "Bluetooth Soundbar", code: "SBAR", unit: "piece", basePrice: 8500, aliases: ["sound bar", "speaker bar", "audio bar"] },
      { name: "Wireless Headphones", code: "HDPH", unit: "piece", basePrice: 4500, aliases: ["headset", "earphones", "anc headphones"] },
      { name: "Home Theater System", code: "HTS", unit: "piece", basePrice: 25000, aliases: ["surround sound", "speakers", "dolby audio"] },
      { name: "4K Projector", code: "PROJ", unit: "piece", basePrice: 55000, aliases: ["beamer", "home cinema", "video projector"] },
      { name: "Noise Cancelling Earbuds", code: "EARB", unit: "piece", basePrice: 6500, aliases: ["wireless buds", "in-ear audio", "airpods type"] },
      { name: "Digital Mirrorless Camera", code: "CAM", unit: "piece", basePrice: 68000, aliases: ["dslr alternative", "photo camera", "vlogging cam"] },
      { name: "Waterproof Bluetooth Speaker", code: "SPKR", unit: "piece", basePrice: 3800, aliases: ["portable speaker", "wireless speaker", "jbl type"] },
      { name: "4K Streaming Stick", code: "STRM", unit: "piece", basePrice: 2999, aliases: ["tv stick", "firestick type", "smart tv dongle"] },
      { name: "AV Audio Receiver", code: "AVR", unit: "piece", basePrice: 18500, aliases: ["amplifier", "audio receiver", "multichannel amp"] },
      { name: "Blu-ray DVD Player", code: "DVD", unit: "piece", basePrice: 4200, aliases: ["disc player", "dvd deck", "media player"] },
      { name: "Virtual Reality VR Headset", code: "VRHS", unit: "piece", basePrice: 28000, aliases: ["vr goggles", "oculus type", "metaverse headset"] },
      { name: "Smart Fitness Watch", code: "WTCH", unit: "piece", basePrice: 9500, aliases: ["smartwatch", "fitness tracker", "digital watch"] },
      { name: "Voice Assistant Smart Speaker", code: "VASS", unit: "piece", basePrice: 3200, aliases: ["alexa type", "smart home speaker", "voice control"] },
      { name: "4K Action Camera", code: "ACTC", unit: "piece", basePrice: 15000, aliases: ["gopro type", "sports cam", "waterproof camera"] },
      { name: "Hi-Fi MP3 Player", code: "MP3", unit: "piece", basePrice: 2200, aliases: ["walkman type", "music player", "audio player"] },
      { name: "E-Reader Paper Display", code: "ERDR", unit: "piece", basePrice: 8900, aliases: ["kindle type", "e-book reader", "digital reader"] },
      { name: "Wireless Vocal Microphone", code: "MIC", unit: "piece", basePrice: 5200, aliases: ["cordless mic", "stage microphone", "audio input"] },
      { name: "Portable FM Radio AM", code: "RAD", unit: "piece", basePrice: 1200, aliases: ["transistor radio", "vintage radio", "tuner"] },
      { name: "Vinyl Audio Turntable", code: "TURN", unit: "piece", basePrice: 11000, aliases: ["record player", "vinyl deck", "phonograph"] }
    ]
  },
  "Computer Accessories": {
    abbr: "CMP",
    brands: ["Logitech", "Dell", "HP", "Samsung", "Kingston", "Razer", "Corsair", "Crucial"],
    items: [
      { name: "Wireless Keyboard Combo", code: "KBD", unit: "piece", basePrice: 2500, aliases: ["keyboard mouse set", "desktop keyboard", "input keys"] },
      { name: "24 Inch IPS Monitor", code: "MON", unit: "piece", basePrice: 9500, aliases: ["computer screen", "display monitor", "flat panel"] },
      { name: "External Solid State Drive 1TB", code: "ESSD", unit: "piece", basePrice: 7500, aliases: ["portable SSD", "external drive", "backup storage"] },
      { name: "Full HD USB Webcam 1080p", code: "WEBC", unit: "piece", basePrice: 3400, aliases: ["web camera", "video call cam", "usb camera"] },
      { name: "Ergonomic Gaming Mouse RGB", code: "MOU", unit: "piece", basePrice: 1800, aliases: ["rgb mouse", "gamer mouse", "optical pointer"] },
      { name: "Mechanical Gaming Keyboard", code: "MKB", unit: "piece", basePrice: 5500, aliases: ["backlit keyboard", "clicky keys", "mechanical board"] },
      { name: "DDR4 Desktop RAM 16GB", code: "RAM", unit: "piece", basePrice: 3600, aliases: ["desktop memory", "ram module", "pc memory"] },
      { name: "8-in-1 USB-C Hub Adapter", code: "HUB", unit: "piece", basePrice: 2200, aliases: ["type-c adapter", "dongle", "multiport dock"] },
      { name: "Large Desk Mouse Pad XL", code: "PAD", unit: "piece", basePrice: 650, aliases: ["desk mat", "gaming mat", "mouse mat"] },
      { name: "Aluminum Laptop Stand", code: "STND", unit: "piece", basePrice: 1200, aliases: ["notebook stand", "riser desk", "laptop holder"] },
      { name: "Graphic Drawing Tablet", code: "TAB", unit: "piece", basePrice: 6800, aliases: ["pen tablet", "digitizer", "sketch pad"] },
      { name: "Laptop Cooling Pad Dual Fan", code: "COOL", unit: "piece", basePrice: 1100, aliases: ["notebook cooler", "cooling stand", "fan pad"] },
      { name: "Mini USB Bluetooth Dongle", code: "DONG", unit: "piece", basePrice: 450, aliases: ["bluetooth adapter", "usb receiver", "wireless key"] },
      { name: "External HDD 2TB", code: "EHDD", unit: "piece", basePrice: 5200, aliases: ["external hard drive", "portable backup", "usb disk"] },
      { name: "CPU Liquid Cooler AIO", code: "LC", unit: "piece", basePrice: 6500, aliases: ["water cooling", "aio cooler", "liquid heat sink"] },
      { name: "ARGB PC Case Fan 120mm", code: "FAN", unit: "piece", basePrice: 850, aliases: ["cabinet fan", "rgb cooler", "computer fan"] },
      { name: "High Performance Thermal Paste", code: "PAST", unit: "piece", basePrice: 350, aliases: ["thermal grease", "heat sink compound", "cpu paste"] },
      { name: "Metal USB Flash Drive 64GB", code: "USB", unit: "piece", basePrice: 550, aliases: ["pen drive", "usb thumb drive", "flash memory"] },
      { name: "3-Port HDMI Switch Splitter", code: "HDM", unit: "piece", basePrice: 950, aliases: ["hdmi hub", "selector switch", "display switcher"] },
      { name: "DisplayPort 1.4 Cable 2m", code: "DP", unit: "piece", basePrice: 600, aliases: ["dp wire", "monitor cord", "displayport lead"] }
    ]
  },
  "Office Equipment": {
    abbr: "OEQ",
    brands: ["Canon", "Epson", "HP", "Brother", "Xerox", "Honeywell"],
    items: [
      { name: "Monochrome Laser Printer", code: "PRN", unit: "piece", basePrice: 12500, aliases: ["office printer", "xerox machine", "laserjet"] },
      { name: "High Speed Document Scanner", code: "SCN", unit: "piece", basePrice: 9800, aliases: ["flatbed scanner", "image scanner", "digitalizer"] },
      { name: "Cross-Cut Paper Shredder", code: "SHRD", unit: "piece", basePrice: 4800, aliases: ["document destroyer", "strip shredder", "shredder"] },
      { name: "3LCD Office Projector 3600lm", code: "PRO", unit: "piece", basePrice: 32000, aliases: ["conference display", "beamer", "data projector"] },
      { name: "Thermal Laminating Machine", code: "LAM", unit: "piece", basePrice: 2200, aliases: ["laminator", "plastic pouch machine", "sheet laminator"] },
      { name: "Desktop Label Printer USB", code: "LBL", unit: "piece", basePrice: 5400, aliases: ["sticker printer", "barcode labels", "thermal tape"] },
      { name: "Handheld Barcode Scanner", code: "BAR", unit: "piece", basePrice: 1800, aliases: ["laser barcode reader", "pos scanner", "upc scanner"] },
      { name: "Heavy Duty Cash Drawer", code: "CSH", unit: "piece", basePrice: 2800, aliases: ["cash box", "pos drawer", "money locker"] },
      { name: "Rotary Paper Trimmer Cutter", code: "CUT", unit: "piece", basePrice: 1400, aliases: ["paper slicer", "guillotine cutter", "trimmer board"] },
      { name: "Magnetic Dry Erase Whiteboard", code: "WBD", unit: "piece", basePrice: 2100, aliases: ["chalkboard alternative", "marker board", "write board"] },
      { name: "Comb Binder Binding Machine", code: "BIND", unit: "piece", basePrice: 3600, aliases: ["spiral binder", "report binder", "punching binder"] },
      { name: "Plain Paper Fax Machine", code: "FAX", unit: "piece", basePrice: 7200, aliases: ["telecopier", "facsimile", "office fax"] },
      { name: "12-Digit Desktop Calculator", code: "CALC", unit: "piece", basePrice: 650, aliases: ["adding machine", "basic calculator", "electronic counter"] },
      { name: "Laminating Pouches A4 100-Pack", code: "POUC", unit: "pack", basePrice: 850, aliases: ["laminating sheets", "plastic pouches", "laminator pack"] },
      { name: "PVC ID Card Printer Single", code: "IDP", unit: "piece", basePrice: 42000, aliases: ["badge printer", "plastic card maker", "employee ID"] },
      { name: "High Res Document Camera USB", code: "DCAM", unit: "piece", basePrice: 11000, aliases: ["visualizer", "overhead presenter", "classroom camera"] },
      { name: "Automatic Currency Value Counter", code: "VALC", unit: "piece", basePrice: 9500, aliases: ["bill counter", "money counter", "note counter"] },
      { name: "Biometric Fingerprint Time Attendance", code: "BIOM", unit: "piece", basePrice: 5800, aliases: ["punch card machine", "employee logs", "rfid logs"] },
      { name: "4-Line Telephone Intercom System", code: "INTC", unit: "piece", basePrice: 6800, aliases: ["office phone hub", "pabx exchange", "intercom box"] },
      { name: "Interactive Smart Board Touch", code: "SBRD", unit: "piece", basePrice: 98000, aliases: ["touchscreen display", "electronic whiteboard", "presentation display"] }
    ]
  },
  "Networking Products": {
    abbr: "NET",
    brands: ["Cisco", "TP-Link", "D-Link", "Ubiquiti", "Netgear", "Linksys"],
    items: [
      { name: "Gigabit Dual-Band Wi-Fi Router", code: "RTR", unit: "piece", basePrice: 3200, aliases: ["wireless router", "broadband router", "internet hub"] },
      { name: "16-Port Gigabit Network Switch", code: "SWT", unit: "piece", basePrice: 4200, aliases: ["rj45 switch", "ethernet hub", "lan switch"] },
      { name: "Cat6 UTP Ethernet Cable 305m", code: "CAB", unit: "coil", basePrice: 6800, aliases: ["lan wire", "network cable", "cat6 roll"] },
      { name: "AC1200 Wireless Access Point", code: "AP", unit: "piece", basePrice: 5200, aliases: ["wifi ap", "ceiling AP", "wireless transmitter"] },
      { name: "24-Port Cat6 Shielded Patch Panel", code: "PNL", unit: "piece", basePrice: 2800, aliases: ["network rack panel", "patch board", "wire organizer"] },
      { name: "Wi-Fi Range Extender Repeater", code: "EXT", unit: "piece", basePrice: 1500, aliases: ["wifi booster", "signal repeater", "extender plug"] },
      { name: "Gigabit PoE Injector Adapter", code: "POE", unit: "piece", basePrice: 900, aliases: ["poe power", "power over ethernet", "poe adapter"] },
      { name: "Gigabit Fiber Media Converter", code: "FMC", unit: "piece", basePrice: 1800, aliases: ["fiber to lan", "optical converter", "media adapter"] },
      { name: "PCIe Gigabit LAN Card RJ45", code: "NIC", unit: "piece", basePrice: 850, aliases: ["network card", "ethernet card", "pci nic"] },
      { name: "1.25G SFP Transceiver Module", code: "SFP", unit: "piece", basePrice: 1200, aliases: ["fiber sfp", "optic module", "gbic adapter"] },
      { name: "RJ45 Connectors Cat6 100-Pack", code: "CON", unit: "pack", basePrice: 450, aliases: ["network plugs", "rj45 tips", "crimping connectors"] },
      { name: "Professional Network Tool Kit", code: "TOOL", unit: "piece", basePrice: 2400, aliases: ["crimping tool set", "lan repair kit", "rj45 pliers"] },
      { name: "Multi-Functional Cable Tester RJ45", code: "TST", unit: "piece", basePrice: 750, aliases: ["wire tester", "lan tester", "continuity tester"] },
      { name: "9U Wall Mount Server Rack Cabinet", code: "RCK", unit: "piece", basePrice: 5800, aliases: ["it rack", "network cabinet", "server box"] },
      { name: "High Speed VDSL ADSL Modem", code: "MDM", unit: "piece", basePrice: 2200, aliases: ["telephone modem", "dsl adapter", "internet receiver"] },
      { name: "AV1000 Powerline Ethernet Adapter", code: "PLN", unit: "piece", basePrice: 3800, aliases: ["powerline wifi", "homeplug", "outlet network"] },
      { name: "Hardware Firewall VPN Appliance", code: "FWL", unit: "piece", basePrice: 21000, aliases: ["security appliance", "vpn router", "network firewall"] },
      { name: "Cisco Console Cable RJ45 to DB9", code: "CNS", unit: "piece", basePrice: 350, aliases: ["console wire", "configuration cable", "db9 lead"] },
      { name: "Wireless USB Wifi Adapter 300M", code: "WUSB", unit: "piece", basePrice: 500, aliases: ["wifi dongle", "usb wifi key", "wireless receiver"] },
      { name: "Cat6 UTP Patch Cord Molded 2m", code: "PCH", unit: "piece", basePrice: 120, aliases: ["lan cord", "patch cable", "rj45 wire"] }
    ]
  },
  "Mobile Accessories": {
    abbr: "MAC",
    brands: ["Anker", "Belkin", "Spigen", "OnePlus", "Xiaomi", "Samsung"],
    items: [
      { name: "Dual Port Fast Charger 30W", code: "CHG", unit: "piece", basePrice: 1200, aliases: ["wall adapter", "power brick", "quick charger"] },
      { name: "Power Bank 20000mAh 20W PD", code: "PBK", unit: "piece", basePrice: 2200, aliases: ["portable battery", "backup charger", "power brick pack"] },
      { name: "Ultra Hybrid Protective Case", code: "CASE", unit: "piece", basePrice: 750, aliases: ["back cover", "phone shell", "spigen case"] },
      { name: "9H Tempered Glass Screen Guard", code: "GLAS", unit: "piece", basePrice: 250, aliases: ["screen protector", "glass guard", "protective layer"] },
      { name: "Braided USB-C to USB-C Cable 1.8m", code: "CBL", unit: "piece", basePrice: 450, aliases: ["type-c wire", "fast charge cable", "usb cord"] },
      { name: "15W Qi Fast Wireless Charger Pad", code: "WCHG", unit: "piece", basePrice: 1600, aliases: ["wireless pad", "induction charger", "wireless dock"] },
      { name: "Magnetic Car Air Vent Phone Mount", code: "MNT", unit: "piece", basePrice: 600, aliases: ["car holder", "phone grip dashboard", "vent clip"] },
      { name: "Extendable Selfie Stick Tripod BT", code: "SLF", unit: "piece", basePrice: 1100, aliases: ["selfie rod", "phone tripod", "bluetooth rod"] },
      { name: "USB 3.0 Type-C to USB OTG Adapter", code: "OTG", unit: "piece", basePrice: 199, aliases: ["otg converter", "usb-c plug", "connector flash"] },
      { name: "Metal Phone Ring Holder Stand", code: "RNG", unit: "piece", basePrice: 150, aliases: ["finger grip", "pop socket type", "kickstand ring"] },
      { name: "Universal Waterproof Phone Pouch", code: "WPP", unit: "piece", basePrice: 350, aliases: ["dry bag phone", "swimming cover", "waterproof sleeve"] },
      { name: "Type-C to 3.5mm Headphone Jack Adapter", code: "ADPT", unit: "piece", basePrice: 299, aliases: ["audio converter", "dac dongle", "headphone adapter"] },
      { name: "65W GaN Multi-Port Charger", code: "GAN", unit: "piece", basePrice: 2800, aliases: ["gan charger", "laptop fast charger", "pd wall brick"] },
      { name: "Smart Bluetooth Tracker Tag", code: "TAG", unit: "piece", basePrice: 1400, aliases: ["key finder", "tile tracker", "smart tag"] },
      { name: "Wired Type-C Bass Earphones", code: "WEAR", unit: "piece", basePrice: 750, aliases: ["wired buds", "in-ear mic", "type-c earphones"] },
      { name: "3-Axis Handheld Smartphone Gimbal", code: "GIM", unit: "piece", basePrice: 6500, aliases: ["phone stabilizer", "video stabilizer", "vlogging gimbal"] },
      { name: "Running Sports Gym Armband", code: "ARM", unit: "piece", basePrice: 400, aliases: ["phone band sleeve", "exercise case", "arm sleeve strap"] },
      { name: "Neoprene Cable Organizer Ties 10P", code: "TIE", unit: "pack", basePrice: 250, aliases: ["wire straps", "cable wraps", "velcro ties"] },
      { name: "Active Stylus Touch Pen Universal", code: "PEN", unit: "piece", basePrice: 1800, aliases: ["touchscreen pen", "tablet pen", "digital pencil"] },
      { name: "Bluetooth Mobile Gaming Controller", code: "CTR", unit: "piece", basePrice: 2400, aliases: ["phone gamepad", "gaming controller", "joystick attachment"] }
    ]
  },
  "Electrical Items": {
    abbr: "ELE",
    brands: ["Polycab", "Havells", "Philips", "Legrand", "Schneider", "Syska", "Anchor"],
    items: [
      { name: "PVC Conduit Pipe 25mm 3m", code: "PIPE", unit: "piece", basePrice: 110, aliases: ["wiring pipe", "pvc tube", "conduit sleeve"] },
      { name: "Conduit Bend 25mm", code: "BND", unit: "piece", basePrice: 15, aliases: ["pipe elbow", "conduit elbow", "wiring turn"] },
      { name: "Modular Plate 4 Module", code: "PLT", unit: "piece", basePrice: 55, aliases: ["switch plate", "wall plate", "modular frame"] },
      { name: "MCB Single Pole 16A C-Curve", code: "MCB", unit: "piece", basePrice: 195, aliases: ["circuit breaker", "mcb switch", "fuse switch"] },
      { name: "ELCB RCCB 40A 30mA DP", code: "ELCB", unit: "piece", basePrice: 1100, aliases: ["shock protection", "earth leakage breaker", "rccb switch"] },
      { name: "Modular Distribution Board 8-Way", code: "MDB", unit: "piece", basePrice: 850, aliases: ["mcb box", "distribution box", "breaker panel"] },
      { name: "LED Bulb 9W Cool Day Light B22", code: "BULB", unit: "piece", basePrice: 75, aliases: ["led light", "9w bulb", "lamp b22"] },
      { name: "LED Downlight Panel 12W Square", code: "PAN", unit: "piece", basePrice: 250, aliases: ["panel light", "ceiling led", "downlight"] },
      { name: "Decorative Ceiling Fan 48 Inch", code: "FAN", unit: "piece", basePrice: 2200, aliases: ["ceiling fan", "havells fan", "3-blade fan"] },
      { name: "Ventilation Exhaust Fan 9 Inch", code: "EXH", unit: "piece", basePrice: 900, aliases: ["kitchen fan", "bathroom exhaust", "suction fan"] },
      { name: "Modular Fan Speed Regulator Step", code: "REG", unit: "piece", basePrice: 180, aliases: ["fan regulator", "speed step switch", "dimmer switch"] },
      { name: "Insulation PVC Adhesive Tape 1 Roll", code: "TAPE", unit: "piece", basePrice: 15, aliases: ["electrical tape", "black tape", "wire tape"] },
      { name: "Extension Board 4-Way 1.5m Wire", code: "EXTB", unit: "piece", basePrice: 380, aliases: ["power strip", "spike buster", "multiplug board"] },
      { name: "Pendant Bulb Holder B22 Brass", code: "HLDR", unit: "piece", basePrice: 25, aliases: ["lamp holder", "b22 socket", "bulb base"] },
      { name: "PVC Wall Plugs Gitti 6mm 100P", code: "PLUG", unit: "pack", basePrice: 25, aliases: ["wall anchors", "plastic plugs", "screw plugs"] },
      { name: "Main Switch Double Pole 32A", code: "MSW", unit: "piece", basePrice: 420, aliases: ["main fuse", "metal clad switch", "dp switch board"] },
      { name: "Industrial Socket Outlet 3-Pin 16A", code: "ISOC", unit: "piece", basePrice: 240, aliases: ["industrial plug socket", "power socket", "heavy socket"] },
      { name: "Wire Stripping Crimping Tool Hand", code: "WSTR", unit: "piece", basePrice: 320, aliases: ["wire stripper", "cable cutter", "stripping plier"] },
      { name: "Wire 1.5 Sqmm Red 90m Coil", code: "WIRE", unit: "coil", basePrice: 1350, aliases: ["wiring cable", "1.5mm wire", "polycab coil"] },
      { name: "Nylon Cable Ties 4 Inch 100-Pack", code: "CTIE", unit: "pack", basePrice: 95, aliases: ["zip ties", "wire ties", "cable straps pack"] }
    ]
  },
  "Tools": {
    abbr: "TOL",
    brands: ["Bosch", "Makita", "Stanley", "DeWalt", "Fluke", "Taparia"],
    items: [
      { name: "Hammer Drill Machine 650W", code: "DRL", unit: "piece", basePrice: 3200, aliases: ["impact drill", "boring machine", "wall drill"] },
      { name: "Cordless Screwdriver 3.6V Kit", code: "CSCR", unit: "piece", basePrice: 1850, aliases: ["power screwdriver", "hand drill driver", "battery driver"] },
      { name: "Adjustable Spanner Wrench 10 Inch", code: "WRN", unit: "piece", basePrice: 450, aliases: ["slide wrench", "monkey wrench", "spanner key"] },
      { name: "Digital Multimeter AC DC Tester", code: "DMM", unit: "piece", basePrice: 1200, aliases: ["voltage tester", "current meter", "fluke type"] },
      { name: "Soldering Iron 25W High Quality", code: "SLD", unit: "piece", basePrice: 280, aliases: ["welding pen", "soldering gun", "solder iron"] },
      { name: "Steel Claw Hammer Wooden Handle", code: "HAM", unit: "piece", basePrice: 350, aliases: ["nail hammer", "striking tool", "iron hammer"] },
      { name: "Precision Screwdriver Set 31-in-1", code: "SSET", unit: "piece", basePrice: 400, aliases: ["screw bits kit", "magnetic screwdrivers", "repair tool set"] },
      { name: "Heavy Duty Retractable Utility Knife", code: "KNIF", unit: "piece", basePrice: 150, aliases: ["box cutter", "paper cutter knife", "snap-off blade"] },
      { name: "Steel Measuring Tape 5m 16ft", code: "TAPE", unit: "piece", basePrice: 220, aliases: ["tape measure", "ruler tape", "measuring ruler"] },
      { name: "Hand Saw Carbon Steel 18 Inch", code: "SAW", unit: "piece", basePrice: 480, aliases: ["wood cutter saw", "hacksaw alternative", "manual saw"] },
      { name: "Combination Pliers Insulated 8 Inch", code: "PLI", unit: "piece", basePrice: 290, aliases: ["cutting pliers", "pliers hand tool", "gripping tool"] },
      { name: "Spirit Level Ruler 12 Inch 3-Vial", code: "LVL", unit: "piece", basePrice: 320, aliases: ["bubble level", "level indicator", "alignment tool"] },
      { name: "Heavy Duty Variable Temp Heat Gun", code: "HGUN", unit: "piece", basePrice: 1950, aliases: ["hot air blower", "heat shrinker", "paint stripper"] },
      { name: "Angle Grinder Machine 850W 4 Inch", code: "GRND", unit: "piece", basePrice: 2600, aliases: ["metal cutter", "grinder hand tool", "disc grinder"] },
      { name: "Automatic Wire Stripper Cutter", code: "ASTR", unit: "piece", basePrice: 650, aliases: ["self-adjusting stripper", "cable peeler", "wire cutter tool"] },
      { name: "Plastic Toolbox Organizer Heavy", code: "BOX", unit: "piece", basePrice: 950, aliases: ["tool storage box", "hardware chest", "carry case"] },
      { name: "Hex Key Allen Wrench Set 9-Piece", code: "ALN", unit: "piece", basePrice: 350, aliases: ["allen keys pack", "l-wrench set", "hex tools"] },
      { name: "Bench Vise Table Clamp 4 Inch", code: "VISE", unit: "piece", basePrice: 1650, aliases: ["bench clamp", "holding vice", "worktable clamp"] },
      { name: "Masonry Drill Bit Set 5-Piece", code: "DBIT", unit: "piece", basePrice: 450, aliases: ["drill bits wall", "concrete bits", "carbide tip bits"] },
      { name: "Rosin Core Soldering Lead Wire", code: "WIRE", unit: "piece", basePrice: 180, aliases: ["solder wire roll", "soldering lead", "flux core solder"] }
    ]
  },
  "Hardware": {
    abbr: "HRD",
    brands: ["Godrej", "Yale", "Link", "Generic"],
    items: [
      { name: "Brass Ball Bearing Butt Hinge 4 Inch", code: "HNG", unit: "piece", basePrice: 180, aliases: ["door hinge", "butt hinge", "brass joint"] },
      { name: "Double Locking Padlock 50mm", code: "LOCK", unit: "piece", basePrice: 450, aliases: ["pad lock", "key lock", "safety padlock"] },
      { name: "Stainless Steel Mortise Door Lock", code: "MLOK", unit: "piece", basePrice: 2200, aliases: ["handle lock", "door handle lock", "mortise cylinder"] },
      { name: "Telescopic Drawer Slides 18 Inch", code: "SLD", unit: "pair", basePrice: 450, aliases: ["drawer runners", "drawer channels", "telescopic slides"] },
      { name: "Steel L-Bracket Corner Support", code: "BRKT", unit: "piece", basePrice: 25, aliases: ["angle bracket", "l shape support", "joint bracket"] },
      { name: "Expansion Shield Anchors M8 50-Pack", code: "ANCH", unit: "pack", basePrice: 350, aliases: ["concrete anchors", "metal expansion bolts", "rawbolts"] },
      { name: "Zinc Alloy Modern Cabinet Handle", code: "HNDL", unit: "piece", basePrice: 120, aliases: ["drawer pull", "wardrobe handle", "t-bar handle"] },
      { name: "Tower Bolt Latch Lock 6 Inch", code: "BOLT", unit: "piece", basePrice: 95, aliases: ["door latch bolt", "sliding bolt", "tower bolt security"] },
      { name: "Magnetic Heavy Duty Door Stopper", code: "STOP", unit: "piece", basePrice: 150, aliases: ["door catch", "magnetic stopper", "wall door bumper"] },
      { name: "Spring Toggle Bolts M6 20-Pack", code: "TOGL", unit: "pack", basePrice: 280, aliases: ["butterfly anchors", "drywall toggle bolts", "cavity wall plugs"] },
      { name: "Self Tapping Wood Screws 1 Inch 100P", code: "SCRW", unit: "pack", basePrice: 85, aliases: ["wood screws", "philips head screws", "fasteners pack"] },
      { name: "Hand Blind Rivet Gun Tool", code: "RIVT", unit: "piece", basePrice: 750, aliases: ["pop rivet gun", "riveter tool", "hand puller riveter"] },
      { name: "Magnetic Cabinet Door Catch Double", code: "CTCH", unit: "piece", basePrice: 45, aliases: ["cupboard magnet", "cabinet catch", "magnetic latch"] },
      { name: "Heavy Duty Iron Padbolt Latch", code: "PDBT", unit: "piece", basePrice: 140, aliases: ["padlock bolt", "gate latch lock", "outdoor latch bolt"] },
      { name: "Steel Corner Braces Plate Flat 4P", code: "CBRA", unit: "pack", basePrice: 110, aliases: ["flat braces", "mending plates", "straight brackets"] },
      { name: "Fully Threaded Rod M10 1m", code: "ROD", unit: "piece", basePrice: 240, aliases: ["stud bolt", "threaded bar", "metal rod lead"] },
      { name: "Hook and Eye Turnbuckle Tensioner", code: "TNBK", unit: "piece", basePrice: 160, aliases: ["cable tensioner", "wire strainer", "rigging hook"] },
      { name: "Stainless Steel Screw Eyes Hook 10P", code: "EYEH", unit: "pack", basePrice: 95, aliases: ["eye screws", "hook screws", "threaded eye rings"] },
      { name: "Drywall Self Drilling Plastic Anchors", code: "ANCHP", unit: "pack", basePrice: 180, aliases: ["plasterboard plugs", "drywall wall anchors", "sheetrock plugs"] },
      { name: "Hydraulic Automatic Door Closer 60kg", code: "DCLS", unit: "piece", basePrice: 1850, aliases: ["pneumatic door closer", "soft close door", "overhead closer"] }
    ]
  },
  "Furniture": {
    abbr: "FURN",
    brands: ["Featherlite", "Godrej Interio", "Steelcase", "Herman Miller"],
    items: [
      { name: "High Back Ergonomic Mesh Chair", code: "CHR", unit: "piece", basePrice: 7800, aliases: ["office chair", "desk chair", "mesh task chair"] },
      { name: "Wooden Executive Desk 5ft", code: "DSK", unit: "piece", basePrice: 11500, aliases: ["office desk", "writing table", "study desk"] },
      { name: "3-Drawer Metal Mobile Pedestal", code: "PED", unit: "piece", basePrice: 4200, aliases: ["under desk drawer", "file cabinet drawer", "mobile pedestal"] },
      { name: "5-Shelf Wooden Bookcase Cupboard", code: "BKS", unit: "piece", basePrice: 6500, aliases: ["bookshelf rack", "office cabinet", "file rack shelf"] },
      { name: "Modular Conference Table 8-Seater", code: "CONF", unit: "piece", basePrice: 24000, aliases: ["meeting room table", "boardroom table", "long desk"] },
      { name: "Premium Leather Executive Chair", code: "ECHR", unit: "piece", basePrice: 14500, aliases: ["boss chair", "director chair", "high back leather"] },
      { name: "Mid Back Task Office Chair Nylon", code: "MCHR", unit: "piece", basePrice: 4800, aliases: ["computer chair", "swivel chair", "staff seat"] },
      { name: "L-Shape Modular Workspace Desk", code: "LDSK", unit: "piece", basePrice: 18500, aliases: ["corner desk", "cubicle desk", "office workstation"] },
      { name: "Reception Welcome Desk Counter", code: "RCP", unit: "piece", basePrice: 13500, aliases: ["front desk table", "reception counter", "lobby desk"] },
      { name: "Whiteboard Stand Mobile Dual Side", code: "WBDS", unit: "piece", basePrice: 3200, aliases: ["board stand wheels", "whiteboard holder", "dry erase stand"] },
      { name: "Steel Almirah Cupboard Locker", code: "ALM", unit: "piece", basePrice: 16500, aliases: ["wardrobe cupboard", "steel cabinet locker", "safe vault"] },
      { name: "Office Credenza Side Storage Buffet", code: "CRDZ", unit: "piece", basePrice: 9500, aliases: ["side credenza cupboard", "printer table storage", "low cabinet"] },
      { name: "Comfortable Fabric Lounge Sofa 1S", code: "LNG", unit: "piece", basePrice: 8800, aliases: ["sofa chair lobby", "waiting room couch", "visitor single sofa"] },
      { name: "Nesting Coffee Tables Set of 3", code: "NST", unit: "piece", basePrice: 4600, aliases: ["accent tables", "nesting tables", "lobby stool set"] },
      { name: "Metal Folding Chair Padded Seat", code: "FLD", unit: "piece", basePrice: 1100, aliases: ["training chair", "folding seat", "portable visitor chair"] },
      { name: "Ergonomic Office Footrest Angle", code: "FTR", unit: "piece", basePrice: 850, aliases: ["foot stool under desk", "ergonomic foot rest", "feet elevator"] },
      { name: "Single Desktop Monitor Arm Mount", code: "MARM", unit: "piece", basePrice: 2400, aliases: ["monitor desk mount", "gas spring arm", "vesa mount bracket"] },
      { name: "Acoustic Partition Office Screen Panel", code: "PART", unit: "piece", basePrice: 3500, aliases: ["desk divider screen", "acoustic panel board", "cubicle partition"] },
      { name: "Premium Notice Cork Board Wall", code: "CRKB", unit: "piece", basePrice: 1200, aliases: ["bulletin board pin", "corkboard office", "push pin board"] },
      { name: "Metal Storage Locker 6-Compartment", code: "LCKR", unit: "piece", basePrice: 12500, aliases: ["staff locker cabinet", "school lockers", "changing room storage"] }
    ]
  },
  "Industrial Products": {
    abbr: "IND",
    brands: ["3M", "Honeywell", "Bosch", "Havells", "Generic"],
    items: [
      { name: "Vented Safety Helmet Ratchet Suspension", code: "HLMT", unit: "piece", basePrice: 250, aliases: ["hard hat protection", "construction helmet", "safety cap site"] },
      { name: "Cut Resistant PU Coated Gloves 1P", code: "GLV", unit: "pair", basePrice: 180, aliases: ["work gloves grip", "safety hand protection", "abrasion resistant"] },
      { name: "Anti-Scratch Clear Safety Goggles", code: "GOGL", unit: "piece", basePrice: 120, aliases: ["eye shield glasses", "protective eyewear", "chemical safety glasses"] },
      { name: "Portable Air Compressor 24L 2HP", code: "COMP", unit: "piece", basePrice: 14500, aliases: ["pneumatic pump", "piston air compressor", "tire inflator tank"] },
      { name: "Steel Toe Leather Safety Shoes", code: "SHOE", unit: "pair", basePrice: 1850, aliases: ["protective boots safety", "construction shoes", "puncture proof boots"] },
      { name: "Noise Protection Ear Muffs SNR 30dB", code: "EARM", unit: "piece", basePrice: 650, aliases: ["hearing protection ear", "sound proof muffs", "industrial ear cover"] },
      { name: "Particulate Respirator Mask N95 20P", code: "MASK", unit: "pack", basePrice: 950, aliases: ["dust mask respirator", "n95 face mask pack", "pollution protection"] },
      { name: "Auto Darkening Welding Helmet Shield", code: "WELD", unit: "piece", basePrice: 3800, aliases: ["welding mask solar", "welding goggles hood", "arc welder shield"] },
      { name: "Full Body Safety Harness Rope Lanyard", code: "HRNS", unit: "piece", basePrice: 2400, aliases: ["fall arrest harness", "height safety belt", "harness double lanyard"] },
      { name: "High Visibility Reflective Safety Vest", code: "VEST", unit: "piece", basePrice: 150, aliases: ["reflector jacket neon", "traffic vest warning", "construction visibility"] },
      { name: "Precision Digital Dial Indicator Caliper", code: "DIAL", unit: "piece", basePrice: 2800, aliases: ["measuring dial gauge", "plunger indicator", "micrometer dial"] },
      { name: "Stainless Steel Digital Vernier Caliper 6In", code: "VERN", unit: "piece", basePrice: 1650, aliases: ["vernier caliper metric", "measuring gauge tool", "digital micrometer slider"] },
      { name: "Glycerin Filled Utility Pressure Gauge", code: "PGAU", unit: "piece", basePrice: 650, aliases: ["psi bar gauge pressure", "hydraulic dial indicator", "manometer gas"] },
      { name: "Non-Contact Infrared Thermometer Laser", code: "THERM", unit: "piece", basePrice: 1800, aliases: ["temp gun laser", "ir thermometer pyrometer", "thermal detector hand"] },
      { name: "Heavy Duty Platform Scale Digital 150kg", code: "SCL", unit: "piece", basePrice: 5500, aliases: ["weighing scale machine", "bench scale industrial", "weight machine platform"] },
      { name: "Industrial Axial Exhaust Fan Heavy Duty", code: "IFAN", unit: "piece", basePrice: 4200, aliases: ["warehouse exhaust ventilation", "industrial cooling fan", "axial blower fan"] },
      { name: "Heavy Duty Manual Chain Pulley Block 2 Ton", code: "PULY", unit: "piece", basePrice: 6500, aliases: ["chain block hoist", "manual pulley crane", "material lifter hand"] },
      { name: "Spring Loaded Retractable Air Hose Reel 15m", code: "REEL", unit: "piece", basePrice: 3800, aliases: ["pneumatic tube reel", "air pipe auto reel", "hose organizer wall"] },
      { name: "Manual Hydraulic Hand Pallet Truck 2.5T", code: "PAL", unit: "piece", basePrice: 18500, aliases: ["pallet jack pump", "trolley hand forklift", "material pallet lifter"] },
      { name: "Wall Mounted Industrial First Aid Kit Metal", code: "FAID", unit: "piece", basePrice: 1200, aliases: ["medical first aid box", "emergency medical kit", "safety first aid storage"] }
    ]
  }
};

export function generateDummyProducts(): DummyProduct[] {
  const list: DummyProduct[] = [];
  let currentId = 1;

  Object.entries(rawCategoryTemplates).forEach(([category, data]) => {
    data.items.forEach((item, index) => {
      // Pick a brand deterministically using modulo
      const brand = data.brands[index % data.brands.length];

      // Format Name: "[Brand] [Item Name]"
      const name = `${brand} ${item.name}`;

      // Format SKU: "[Category Abbr]-[Brand Abbr]-[Item Code]-[Seq]"
      const brandAbbr = brand.substring(0, 3).toUpperCase();
      const sku = `${data.abbr}-${brandAbbr}-${item.code}-${100 + index}`;

      // Prices: costPrice and mrp (mrp is costPrice + margin)
      const costPrice = item.basePrice;
      const mrp = Math.ceil(costPrice * 1.25); // 25% margin for MRP

      // Stock quantity: deterministic stock allocation
      // Mix of out of stock, low stock, and high stock for testing
      let stockQty = 50 + (index * 7) % 200;
      if (index === 0) {
        stockQty = 0; // Out of stock
      } else if (index === 1) {
        stockQty = 5; // Low stock
      }

      // Generate a detailed description
      const description = `High-quality ${name} by ${brand}. Designed for reliable business and professional use in ${category} category. Unit: ${item.unit}.`;

      // Alternate names/aliases
      const aliases = [
        ...item.aliases,
        `${brand.toLowerCase()} ${item.name.toLowerCase()}`,
        item.name.toLowerCase()
      ];

      const tax = 18; // standard 18% GST

      list.push({
        sku,
        name,
        brand,
        category,
        costPrice,
        mrp,
        stockQty,
        unit: item.unit,
        description,
        tax,
        aliases
      });

      currentId++;
    });
  });

  return list;
}

export const dummyProducts = generateDummyProducts();
