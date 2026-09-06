/*using System.Text.Json;

List<IconModel> Icons = new List<IconModel>();


var directories = Directory.GetDirectories(@"C:\Users\SLVZ\OneDrive\SLVZ\Web\UI\wwwroot\icons");


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

File.WriteAllText(@"C:\Users\SLVZ\OneDrive\SLVZ\Web\UI\wwwroot\icons\icons.json",
    JsonSerializer.Serialize<List<IconModel>>(Icons));



Console.WriteLine("Done");
Console.ReadKey();




class IconModel
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? FilePreview { get; set; }
    public List<string> Files { get; set; } = new List<string>();
}
*/