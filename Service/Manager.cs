using System.Text.Json;

namespace UI.Service;

public static class Manager
{
    public static void Initialize()
    {

        List<IconModel> Icons = new List<IconModel>();

        var baseDirectory = @"C:\Users\SLVZ\OneDrive\SLVZ\Web\UI";

        var directories = Directory.GetDirectories(Path.Combine(baseDirectory
            , "wwwroot", "icons"));


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
            {
                if (f.Name == "desktop.ini")
                    continue;

                icon.Files.Add(f.Name);
            }

            Icons.Add(icon);
        }

        File.WriteAllText(Path.Combine(baseDirectory, "wwwroot", "icons.json"),
            JsonSerializer.Serialize<List<IconModel>>(Icons));


    }
    class FileModel
    {
        public string? Name { get; set; }
        public bool Selected { get; set; } = false;
    }

    class IconModel
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? FilePreview { get; set; }
        public List<string> Files { get; set; } = new List<string>();
    }
}
