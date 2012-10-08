# java::default

include_recipe "java::#{node['java']['flavor']}"

package "ant" do
	action :install
end