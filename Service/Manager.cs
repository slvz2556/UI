using System.Text.Json;
using UI.Models.Icons;

namespace UI.Service;

public static class Manager
{
    public static void Initialize()
    {
        List<IconModel> Icons = new List<IconModel>();

#if DEBUG
        var directories = Directory.GetDirectories(Path.Combine(AppContext.BaseDirectory.Split(@"\bin\")[0]
            , "wwwroot", "icons"));
#else
        var directories = Directory.GetDirectories(Path.Combine(AppContext.BaseDirectory, "wwwroot", "icons"));
#endif

        int index = 0;

        foreach (var directory in directories)
        {
            var info = new DirectoryInfo(directory);
            var files = info.GetFiles();

            var icon = new IconModel
            {
                Id = index++,
                Name = info.Name,
                FilePreview = files.Any(x => x.Name.EndsWith("regular.svg")) ?
                files.Where(x => x.Name.EndsWith("regular.svg")).First().Name : files.First().Name
            };

            foreach (var f in files)
                icon.Files.Add(f.Name);

            Icons.Add(icon);
        }

#if DEBUG
        File.WriteAllText(Path.Combine(AppContext.BaseDirectory.Split(@"\bin\")[0], "wwwroot", "icons.json"),
            JsonSerializer.Serialize<List<IconModel>>(Icons));
#else
        File.WriteAllText(Path.Combine(AppContext.BaseDirectory, "wwwroot", "icons.json"), 
        JsonSerializer.Serialize<List<IconModel>>(Icons)); 
#endif

    }
}
