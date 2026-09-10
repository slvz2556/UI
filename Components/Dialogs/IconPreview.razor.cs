using Microsoft.JSInterop;
using System.Net.Http.Json;
using UI.Models.Icons;

namespace UI.Components.Dialogs;

public partial class IconPreview : IDisposable
{
    CancellationTokenSource? _tokenSource;
    bool copied = false; 
    private bool visibility { get; set; } = false;

    private static IconPreview? _dialog;

    public IconModel Icon = new IconModel();

    public List<FileModel> Files = new List<FileModel>();

    protected override void OnInitialized()
    {
        _dialog = this;
        _tokenSource = new CancellationTokenSource();
    }


    public static void OpenDialog(IconModel _icon)
    {
        _dialog?.Icon = _icon;
        _dialog?.visibility = true;


        _dialog?.Files.Clear();

        foreach (var file in _dialog?.Icon.Files)
        {
            _dialog?.Files.Add(new FileModel
            {
                Name = file,
                Selected = false
            });
        }
        _dialog?.Files[0].Selected = true;

        _dialog?.StateHasChanged();
    }

    private void CloseDialog()
    {
        visibility = false; 
        StateHasChanged();
    }

    public void Dispose()
    {
        _dialog = null;
        _tokenSource?.Cancel();
        _tokenSource?.Dispose();
    }

    private async void IPreview_PreviewChanged(object? sender, EventArgs e)
    => await InvokeAsync(StateHasChanged);


    private void SelectFile(FileModel file)
    {
        foreach (var item in Files)
            item.Selected = false;

        file.Selected = true;
    }


    private async void CopySVG()
    {
        var file = Files.Where(x => x.Selected).First();

        using var client = new HttpClient();

#if DEBUG
        var xml = await client.GetStringAsync($"https://localhost:7296/icons/{Icon.Name}/{file.Name}");
#else
        var xml = await client.GetStringAsync($"https://icons.slvz.dev/icons/{Icon.Name}/{file.Name}");
#endif

        await Js.InvokeVoidAsync("CopyText", xml);
        
        copied = true;
        StateHasChanged();

        await Task.Delay(2000, _tokenSource.Token);
        
        copied = false;
        StateHasChanged();
    }

    private async void DownloadSVG()
    {
        var file = Files.Where(x => x.Selected).First();

        await Js.InvokeVoidAsync("DownloadFile", $"icons/{Icon.Name}/{file.Name}");

#if DEBUG
        await Js.InvokeVoidAsync("DownloadFile", $"https://localhost:7296/icons/icons/{Icon.Name}/{file.Name}");
#else
        await Js.InvokeVoidAsync("DownloadFile", $"https://icons.slvz.dev/icons/icons/{Icon.Name}/{file.Name}");
#endif
    }

}

