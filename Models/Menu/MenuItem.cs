namespace UI.Models.Menu;

public class MenuItem
{
    public string? Name { get; set; }
    public string? Location { get; set; }
    public bool Selected { get; set; } = false;
    public string? Class { get => Selected ? "primary" : "default"; }

}
