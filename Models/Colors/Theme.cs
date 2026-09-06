
namespace UI.Models.Colors;

public enum ThemeItems
{
    LightStone,
    RoyalViolet,
    OrchidBloom,
    Mint,
    AzureSky,

    // ===================== LIGHT THEMES (20) =====================
    RoseBlush,
    SunsetOrange,
    GoldenHoney,
    ButterYellow,
    LimeFresh,
    EmeraldMint,
    TurquoiseWave,
    SkyCyan,
    OceanBlue,
    Periwinkle,
    Amethyst,
    LavenderDream,
    BubblegumPink,
    CoralPink,
    Tangerine,
    WarmSand,
    Cinnamon,
    SageGreen,
    SteelBlue,
    SoftViolet,

    // ===================== DARK THEMES (20) =====================
    MidnightPlum,
    DeepOcean,
    NavyNight,
    DarkOrchid,
    ForestNight,
    DeepBerry,
    IndigoDusk,
    WineRed,
    DarkSlateBlue,
    EspressoBrown,
    CharcoalBlue,
    DeepMagenta,
    PineForest,
    StormGray,
    RoyalIndigo,
    DeepPurpleNight,
    Chestnut,
    Obsidian,
    DarkMaroon,
    DeepTeal
}


public class ThemeInfo
{
    public ThemeItems Theme = ThemeItems.OrchidBloom;

    public string EnTitle { get; set; } = "";
    public string PrTitle { get; set; } = "";
    public string PrimaryColor { get; set; } = "";

    public bool IsDark { get; set; } = false; // If its true, status content will be light

    public bool SubscriptionRequire { get; set; } = false;
}

public static class Themes
{
    public static List<ThemeInfo> List = new List<ThemeInfo>
    {    
        //Free themes
        new ThemeInfo { Theme = ThemeItems.OrchidBloom,EnTitle="Orchid Bloom",PrTitle="شکوفه ارکیده",PrimaryColor= "#ee76fe", IsDark=false},
        new ThemeInfo { Theme = ThemeItems.AzureSky,EnTitle="Azure Sky",PrTitle="آسمان لاجوردی", PrimaryColor= "#3a7bd5",IsDark=false},
        new ThemeInfo { Theme = ThemeItems.MidnightPlum, EnTitle = "Midnight Plum", PrTitle = "آلویی نیمه‌شب", PrimaryColor = "#2D1B4E", IsDark = true, SubscriptionRequire = false },
        new ThemeInfo { Theme = ThemeItems.DeepOcean, EnTitle = "Deep Ocean", PrTitle = "اقیانوس عمیق", PrimaryColor = "#1B3A4B", IsDark = true, SubscriptionRequire = false },
        
        
        
        
        // ===================== LIGHT THEMES =====================
        new ThemeInfo { Theme = ThemeItems.RoyalViolet,EnTitle="Royal Violet",PrTitle="بنفش سلطنتی", PrimaryColor= "#6742bc",IsDark=false, SubscriptionRequire = true},
        new ThemeInfo { Theme = ThemeItems.Mint,EnTitle="Mint",PrTitle="نعنا",PrimaryColor= "#4a9c5d", IsDark=false,SubscriptionRequire=true},
        new ThemeInfo { Theme = ThemeItems.LightStone,EnTitle="Light Stone",PrTitle="سنگ روشن",PrimaryColor= "#c2c2c2", IsDark=false,SubscriptionRequire=true},
        new ThemeInfo { Theme = ThemeItems.RoseBlush, EnTitle = "Rose Blush", PrTitle = "رز صورتی", PrimaryColor = "#E85D75", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.SunsetOrange, EnTitle = "Sunset Orange", PrTitle = "نارنجی غروب", PrimaryColor = "#FF8C42", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.GoldenHoney, EnTitle = "Golden Honey", PrTitle = "عسلی طلایی", PrimaryColor = "#FFC145", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.ButterYellow, EnTitle = "Butter Yellow", PrTitle = "زرد کره‌ای", PrimaryColor = "#F4D35E", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.LimeFresh, EnTitle = "Lime Fresh", PrTitle = "سبز لیمویی", PrimaryColor = "#8AC926", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.EmeraldMint, EnTitle = "Emerald Mint", PrTitle = "زمردی نعنایی", PrimaryColor = "#52B788", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.TurquoiseWave, EnTitle = "Turquoise Wave", PrTitle = "فیروزه‌ای", PrimaryColor = "#2EC4B6", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.SkyCyan, EnTitle = "Sky Cyan", PrTitle = "آبی آسمانی", PrimaryColor = "#4CC9F0", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.OceanBlue, EnTitle = "Ocean Blue", PrTitle = "آبی اقیانوسی", PrimaryColor = "#5390D9", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.Periwinkle, EnTitle = "Periwinkle", PrTitle = "بنفش آسمانی", PrimaryColor = "#7B68EE", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.Amethyst, EnTitle = "Amethyst", PrTitle = "بنفش یاقوتی", PrimaryColor = "#9D4EDD", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.LavenderDream, EnTitle = "Lavender Dream", PrTitle = "یاسی رویایی", PrimaryColor = "#C77DFF", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.BubblegumPink, EnTitle = "Bubblegum Pink", PrTitle = "صورتی آدامسی", PrimaryColor = "#F15BB5", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.CoralPink, EnTitle = "Coral Pink", PrTitle = "صورتی مرجانی", PrimaryColor = "#FF6B9D", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.Tangerine, EnTitle = "Tangerine", PrTitle = "نارنگی", PrimaryColor = "#FB8500", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.WarmSand, EnTitle = "Warm Sand", PrTitle = "شنی گرم", PrimaryColor = "#D4A373", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.Cinnamon, EnTitle = "Cinnamon", PrTitle = "دارچینی", PrimaryColor = "#A98467", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.SageGreen, EnTitle = "Sage Green", PrTitle = "سبز مریمی", PrimaryColor = "#6A994E", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.SteelBlue, EnTitle = "Steel Blue", PrTitle = "آبی فولادی", PrimaryColor = "#457B9D", IsDark = false, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.SoftViolet, EnTitle = "Soft Violet", PrTitle = "بنفش ملایم", PrimaryColor = "#9381FF", IsDark = false, SubscriptionRequire = true },

        // ===================== DARK THEMES =====================

        new ThemeInfo { Theme = ThemeItems.NavyNight, EnTitle = "Navy Night", PrTitle = "سرمه‌ای شب", PrimaryColor = "#14213D", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.DarkOrchid, EnTitle = "Dark Orchid", PrTitle = "ارکیدهٔ تیره", PrimaryColor = "#3D2645", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.ForestNight, EnTitle = "Forest Night", PrTitle = "جنگل شب", PrimaryColor = "#1E5128", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.DeepBerry, EnTitle = "Deep Berry", PrTitle = "توت‌فرنگی تیره", PrimaryColor = "#4A1942", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.IndigoDusk, EnTitle = "Indigo Dusk", PrTitle = "نیلی گرگ‌ومیش", PrimaryColor = "#2C2C54", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.WineRed, EnTitle = "Wine Red", PrTitle = "قرمز شرابی", PrimaryColor = "#6B2737", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.DarkSlateBlue, EnTitle = "Dark Slate Blue", PrTitle = "آبی تخته‌سنگی تیره", PrimaryColor = "#1C2541", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.EspressoBrown, EnTitle = "Espresso Brown", PrTitle = "قهوه‌ای اسپرسو", PrimaryColor = "#3E2723", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.CharcoalBlue, EnTitle = "Charcoal Blue", PrTitle = "آبی زغالی", PrimaryColor = "#212F45", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.DeepMagenta, EnTitle = "Deep Magenta", PrTitle = "سرخابی تیره", PrimaryColor = "#4B1E44", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.PineForest, EnTitle = "Pine Forest", PrTitle = "کاج جنگلی", PrimaryColor = "#0B3D0B", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.StormGray, EnTitle = "Storm Gray", PrTitle = "خاکستری طوفانی", PrimaryColor = "#2B2D42", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.RoyalIndigo, EnTitle = "Royal Indigo", PrTitle = "نیلی سلطنتی", PrimaryColor = "#3A0CA3", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.DeepPurpleNight, EnTitle = "Deep Purple Night", PrTitle = "بنفش شب تیره", PrimaryColor = "#240046", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.Chestnut, EnTitle = "Chestnut", PrTitle = "شاه‌بلوطی", PrimaryColor = "#5C4033", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.Obsidian, EnTitle = "Obsidian", PrTitle = "ابسیدین", PrimaryColor = "#1A1A2E", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.DarkMaroon, EnTitle = "Dark Maroon", PrTitle = "عناب تیره", PrimaryColor = "#3B0918", IsDark = true, SubscriptionRequire = true },
        new ThemeInfo { Theme = ThemeItems.DeepTeal, EnTitle = "Deep Teal", PrTitle = "سبزآبی تیره", PrimaryColor = "#264653", IsDark = true, SubscriptionRequire = true }



    };

}

