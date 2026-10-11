using Microsoft.JSInterop;

namespace UI.Components.Shared;

public enum Languages
{
    Html,
    Css
}

public partial class ExportCode : IDisposable
{
    protected override void OnInitialized()
    {
        exportCode.StateChanged += ExportCode_StateChanged;
    }

    private async void ExportCode_StateChanged(object? sender, EventArgs e)

    {
        await InvokeAsync(StateHasChanged);

        await Task.Delay(100);
        await Js.InvokeVoidAsync("_highlightAll");
    }

    public void Dispose()
    {
        exportCode.StateChanged -= ExportCode_StateChanged;
    }
}

public partial class IExportCode
{
    public event EventHandler StateChanged = delegate { };
    public bool Visibility { get; set; } = false;


    public Languages language { get; set; } = Languages.Html;
    public string Html = "", Css = "";

    public void ShowDialog(string _html, string _css)
    {
        Html = _html;
        Css = _css;
        language = Languages.Html;

        Visibility = true;
        StateChanged.Invoke(this, EventArgs.Empty);
    }

    public void CloseDialog()
    {
        Visibility = false;
        StateChanged.Invoke(this, EventArgs.Empty);
    }

    public void ChangeLanguage(Languages lang)
    {
        language = lang;
        StateChanged.Invoke(this, EventArgs.Empty);
    }

}