namespace UI.Models;

public class IconModel
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? FilePreview {  get; set; }
    public List<string> Files { get; set; } = new List<string>();
}
